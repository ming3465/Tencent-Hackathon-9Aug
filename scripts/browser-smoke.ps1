param(
  [int]$Port = 9223,
  [int]$AppPort = 4173,
  [string]$ScreenshotPath = "",
  [string]$ConsequenceScreenshotPath = ""
)

$ErrorActionPreference = "Stop"
$target = $null

for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
  try {
    $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/list" -TimeoutSec 2
    $matchingTargets = @($targets | Where-Object {
      $_.type -eq "page" -and $_.url -like "http://127.0.0.1:$AppPort/*"
    })
    $target = $matchingTargets[0]
    if ($null -ne $target) { break }
  } catch {
    Start-Sleep -Milliseconds 250
  }
}

if ($null -eq $target) {
  throw "Chrome DevTools target was not available on port $Port."
}

$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$socket.ConnectAsync(
  [Uri]($target.webSocketDebuggerUrl),
  [System.Threading.CancellationToken]::None
).GetAwaiter().GetResult() | Out-Null

$script:nextId = 1

function Invoke-Cdp {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [hashtable]$Params = @{}
  )

  $id = $script:nextId
  $script:nextId += 1
  $payload = @{ id = $id; method = $Method; params = $Params } |
    ConvertTo-Json -Compress -Depth 20
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $segment = [ArraySegment[byte]]::new($bytes)
  $socket.SendAsync(
    $segment,
    [System.Net.WebSockets.WebSocketMessageType]::Text,
    $true,
    [System.Threading.CancellationToken]::None
  ).GetAwaiter().GetResult()

  do {
    $stream = [IO.MemoryStream]::new()
    do {
      $buffer = [byte[]]::new(65536)
      $receiveSegment = [ArraySegment[byte]]::new($buffer)
      $receiveResult = $socket.ReceiveAsync(
        $receiveSegment,
        [System.Threading.CancellationToken]::None
      ).GetAwaiter().GetResult()
      if ($receiveResult.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
        throw "Chrome closed the DevTools connection unexpectedly."
      }
      $stream.Write($buffer, 0, $receiveResult.Count)
    } while (-not $receiveResult.EndOfMessage)

    $message = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
  } while ($null -eq $message.id -or [int]$message.id -ne $id)

  if ($null -ne $message.error) {
    throw "CDP $Method failed: $($message.error.message)"
  }
  return $message.result
}

function Invoke-JavaScript {
  param([Parameter(Mandatory = $true)][string]$Expression)

  $evaluation = Invoke-Cdp -Method "Runtime.evaluate" -Params @{
    expression = $Expression
    awaitPromise = $true
    returnByValue = $true
  }
  if ($null -ne $evaluation.exceptionDetails) {
    $description = $evaluation.exceptionDetails.exception.description
    if (-not $description) { $description = $evaluation.exceptionDetails.text }
    throw "Browser evaluation failed: $description"
  }
  return $evaluation.result.value
}

try {
  Invoke-Cdp -Method "Runtime.enable" | Out-Null
  Invoke-Cdp -Method "Page.enable" | Out-Null
  Invoke-Cdp -Method "Emulation.setDeviceMetricsOverride" -Params @{
    width = 360
    height = 800
    deviceScaleFactor = 1
    mobile = $true
  } | Out-Null

  $serverReady = $false
  for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$AppPort/" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $serverReady = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  if (-not $serverReady) {
    throw "Vite preview was not available on port $AppPort."
  }

  Invoke-Cdp -Method "Page.navigate" -Params @{
    url = "http://127.0.0.1:$AppPort/"
  } | Out-Null
  Start-Sleep -Milliseconds 500

  $initial = Invoke-JavaScript -Expression @'
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let attempt = 0; attempt < 50 && !document.getElementById("btn-start"); attempt += 1) {
    await wait(100);
  }
  for (let attempt = 0; attempt < 50 && document.activeElement?.id !== "btn-start"; attempt += 1) {
    await wait(100);
  }
  window.__smokeErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => {
    window.__smokeErrors.push(args.map((value) => value?.stack ?? String(value)).join(" "));
    originalConsoleError(...args);
  };
  const preClickFocus = document.activeElement?.id;
  document.getElementById("btn-start").click();
  for (let attempt = 0; attempt < 80 && !document.querySelector("#sandbox-stage canvas"); attempt += 1) {
    await wait(100);
  }
  await wait(350);

  const activeButtons = [...document.querySelectorAll(".screen.active button")];
  return {
    screen: document.querySelector(".screen.active")?.id,
    preClickFocus,
    canvasCount: document.querySelectorAll("#sandbox-stage canvas").length,
    stageBusy: document.getElementById("sandbox-stage").getAttribute("aria-busy"),
    focus: document.activeElement?.id,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    undersizedTargets: activeButtons.filter((button) => {
      const box = button.getBoundingClientRect();
      return box.width > 0 && (box.width < 48 || box.height < 48);
    }).length,
    nearby: document.getElementById("nearby-text")?.textContent?.trim(),
    promptVisible: document.getElementById("interaction-prompt")?.classList.contains("visible"),
    errors: window.__smokeErrors,
    liveText: document.getElementById("live-region")?.textContent
  };
})()
'@

  if ($initial.screen -ne "screen-sandbox") {
    throw "Sandbox screen did not open (actual: $($initial.screen), canvases: $($initial.canvasCount), pre-click focus: $($initial.preClickFocus), errors: $($initial.errors -join ' | '))."
  }
  if ($initial.canvasCount -ne 1) { throw "Phaser sandbox canvas did not initialize." }
  if ($initial.stageBusy -ne "false") { throw "Sandbox remained busy after scene creation." }
  if ($initial.focus -ne "sandbox-stage") { throw "Focus did not move into the sandbox." }
  if ($initial.clientWidth -ne 360 -or $initial.scrollWidth -ne 360) {
    throw "The 360px sandbox layout has horizontal overflow."
  }
  if ($initial.undersizedTargets -ne 0) { throw "An active touch target is below 48px." }
  if (-not $initial.promptVisible -or $initial.nearby -notlike "*Uncle Ravi*") {
    throw "The starting noticeboard interaction was not discoverable."
  }

  if ($ScreenshotPath) {
    $capture = Invoke-Cdp -Method "Page.captureScreenshot" -Params @{
      format = "png"
      captureBeyondViewport = $false
    }
    [IO.File]::WriteAllBytes($ScreenshotPath, [Convert]::FromBase64String($capture.data))
  }

  $noticeboard = Invoke-JavaScript -Expression @'
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  document.getElementById("btn-interact").click();
  await wait(80);
  const opened = {
    active: document.getElementById("dialog-overlay").classList.contains("active"),
    speaker: document.getElementById("dialog-speaker")?.textContent?.trim(),
    choices: document.querySelectorAll("#dialog-choices .choice-button").length,
    focusIsChoice: document.activeElement?.classList.contains("choice-button") ?? false
  };
  document.querySelector("#dialog-choices .choice-button").click();
  await wait(80);
  const completed = {
    journalDone: document.getElementById("journal-noticeboard").classList.contains("completed"),
    connection: document.getElementById("meter-connection").getAttribute("aria-valuenow"),
    purpose: document.getElementById("meter-purpose").getAttribute("aria-valuenow"),
    choicesRemaining: document.querySelectorAll("#dialog-choices .choice-button").length
  };
  document.getElementById("btn-dialog-close").click();
  await wait(80);
  return { opened, completed, focus: document.activeElement?.id };
})()
'@

  if (-not $noticeboard.opened.active -or $noticeboard.opened.speaker -ne "Uncle Ravi") {
    throw "Noticeboard dialogue did not open correctly."
  }
  if ($noticeboard.opened.choices -ne 2 -or -not $noticeboard.opened.focusIsChoice) {
    throw "Noticeboard choices or focus were incorrect."
  }
  if (-not $noticeboard.completed.journalDone -or $noticeboard.completed.connection -ne "2") {
    throw "Noticeboard choice did not update sandbox progression."
  }
  if ($noticeboard.completed.purpose -ne "1" -or $noticeboard.completed.choicesRemaining -ne 0) {
    throw "Noticeboard response state was incorrect."
  }
  if ($noticeboard.focus -ne "sandbox-stage") { throw "Dialogue did not restore world focus." }

  if ($ConsequenceScreenshotPath) {
    $capture = Invoke-Cdp -Method "Page.captureScreenshot" -Params @{
      format = "png"
      captureBeyondViewport = $false
    }
    [IO.File]::WriteAllBytes(
      $ConsequenceScreenshotPath,
      [Convert]::FromBase64String($capture.data)
    )
  }

  Invoke-Cdp -Method "Input.dispatchKeyEvent" -Params @{
    type = "rawKeyDown"
    key = "ArrowDown"
    code = "ArrowDown"
    windowsVirtualKeyCode = 40
    nativeVirtualKeyCode = 40
  } | Out-Null
  Start-Sleep -Milliseconds 430
  Invoke-Cdp -Method "Input.dispatchKeyEvent" -Params @{
    type = "keyUp"
    key = "ArrowDown"
    code = "ArrowDown"
    windowsVirtualKeyCode = 40
    nativeVirtualKeyCode = 40
  } | Out-Null
  Start-Sleep -Milliseconds 250

  $nearMemory = Invoke-JavaScript -Expression @'
({
  nearby: document.getElementById("nearby-text")?.textContent?.trim(),
  visible: document.getElementById("interaction-prompt")?.classList.contains("visible")
})
'@
  if (-not $nearMemory.visible -or $nearMemory.nearby -notlike "*memory table*") {
    throw "Keyboard movement did not reach the memory table (visible: $($nearMemory.visible), nearby: $($nearMemory.nearby))."
  }

  $memoryResult = Invoke-JavaScript -Expression @'
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  document.getElementById("btn-interact").click();
  await wait(80);
  const opened = {
    active: document.getElementById("memory-overlay").classList.contains("active"),
    cards: document.querySelectorAll(".memory-card").length,
    focusIsCard: document.activeElement?.classList.contains("memory-card") ?? false
  };

  const cardById = (id) => document.querySelector(`.memory-card[data-id="${id}"]`);
  const known = new Map();
  const remember = (symbol, id) => {
    const ids = known.get(symbol) ?? new Set();
    ids.add(id);
    known.set(symbol, ids);
  };

  for (let turn = 0; turn < 50 && !document.getElementById("memory-complete").classList.contains("visible"); turn += 1) {
    let pair = null;
    for (const [symbol, ids] of known) {
      const available = [...ids].filter((id) => cardById(id)?.dataset.state === "face-down");
      if (available.length >= 2) {
        pair = { symbol, ids: available.slice(0, 2) };
        break;
      }
    }
    if (pair) {
      cardById(pair.ids[0]).click();
      cardById(pair.ids[1]).click();
      known.delete(pair.symbol);
      await wait(50);
      continue;
    }

    const faceDown = [...document.querySelectorAll('.memory-card[data-state="face-down"]')]
      .map((card) => Number(card.dataset.id));
    if (!faceDown.length) break;
    const knownIds = new Set([...known.values()].flatMap((ids) => [...ids]));
    const firstId = faceDown.find((id) => !knownIds.has(id)) ?? faceDown[0];
    cardById(firstId).click();
    await wait(20);
    const firstSymbol = cardById(firstId).textContent;
    const prior = [...(known.get(firstSymbol) ?? [])]
      .find((id) => id !== firstId && cardById(id)?.dataset.state === "face-down");
    remember(firstSymbol, firstId);
    if (prior !== undefined) {
      cardById(prior).click();
      known.delete(firstSymbol);
      await wait(50);
      continue;
    }

    const remaining = [...document.querySelectorAll('.memory-card[data-state="face-down"]')]
      .map((card) => Number(card.dataset.id));
    const remembered = new Set([...known.values()].flatMap((ids) => [...ids]));
    const secondId = remaining.find((id) => !remembered.has(id)) ?? remaining[0];
    cardById(secondId).click();
    await wait(20);
    const secondSymbol = cardById(secondId).textContent;
    remember(secondSymbol, secondId);
    if (document.getElementById("memory-board").getAttribute("aria-busy") === "true") {
      await wait(1100);
    } else {
      known.delete(firstSymbol);
      await wait(50);
    }
  }

  const completed = {
    visible: document.getElementById("memory-complete").classList.contains("visible"),
    progress: document.getElementById("memory-progress")?.textContent?.trim(),
    journalDone: document.getElementById("journal-memory-table").classList.contains("completed"),
    connection: document.getElementById("meter-connection").getAttribute("aria-valuenow"),
    comfort: document.getElementById("meter-comfort").getAttribute("aria-valuenow")
  };
  document.getElementById("btn-memory-leave").click();
  await wait(80);
  return {
    opened,
    completed,
    overlayActive: document.getElementById("memory-overlay").classList.contains("active"),
    focus: document.activeElement?.id
  };
})()
'@

  if (-not $memoryResult.opened.active -or $memoryResult.opened.cards -ne 8) {
    throw "Memory mini-game did not open with four pairs."
  }
  if (-not $memoryResult.opened.focusIsCard) { throw "Memory card focus was not established." }
  if (-not $memoryResult.completed.visible -or $memoryResult.completed.progress -ne "4 of 4 pairs") {
    throw "Memory mini-game did not complete."
  }
  if (-not $memoryResult.completed.journalDone -or $memoryResult.completed.connection -ne "3") {
    throw "Memory completion did not update the journal or Connection meter."
  }
  if ($memoryResult.completed.comfort -ne "1") { throw "Memory completion did not update Comfort." }
  if ($memoryResult.overlayActive -or $memoryResult.focus -ne "sandbox-stage") {
    throw "Memory mini-game did not return focus to the sandbox."
  }

  $upControl = Invoke-JavaScript -Expression @'
(() => {
  const box = document.querySelector('[data-direction="up"]').getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
})()
'@
  Invoke-Cdp -Method "Input.dispatchMouseEvent" -Params @{
    type = "mousePressed"
    x = $upControl.x
    y = $upControl.y
    button = "left"
    clickCount = 1
  } | Out-Null
  Start-Sleep -Milliseconds 430
  Invoke-Cdp -Method "Input.dispatchMouseEvent" -Params @{
    type = "mouseReleased"
    x = $upControl.x
    y = $upControl.y
    button = "left"
    clickCount = 1
  } | Out-Null
  Start-Sleep -Milliseconds 250

  $nearNoticeByTouch = Invoke-JavaScript -Expression @'
({
  nearby: document.getElementById("nearby-text")?.textContent?.trim(),
  visible: document.getElementById("interaction-prompt")?.classList.contains("visible")
})
'@
  if (-not $nearNoticeByTouch.visible -or $nearNoticeByTouch.nearby -notlike "*Uncle Ravi*") {
    throw "Touch movement did not return to the noticeboard."
  }

  $journalAndEvening = Invoke-JavaScript -Expression @'
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  document.getElementById("btn-journal").click();
  await wait(60);
  const journalOpened = {
    open: document.getElementById("journal-panel").classList.contains("open"),
    focus: document.activeElement?.id
  };
  document.querySelector('[data-journal-activity="safe-route"]').click();
  await wait(60);
  const shortcutOpened = {
    dialog: document.getElementById("dialog-overlay").classList.contains("active"),
    speaker: document.getElementById("dialog-speaker")?.textContent?.trim(),
    focusIsChoice: document.activeElement?.classList.contains("choice-button") ?? false
  };
  document.querySelector("#dialog-choices .choice-button").click();
  await wait(60);
  document.getElementById("btn-dialog-close").click();
  await wait(60);
  const ready = {
    safeRouteDone: document.getElementById("journal-safe-route").classList.contains("completed"),
    eveningEnabled: !document.getElementById("btn-evening").disabled,
    connection: document.getElementById("meter-connection").getAttribute("aria-valuenow"),
    purpose: document.getElementById("meter-purpose").getAttribute("aria-valuenow"),
    comfort: document.getElementById("meter-comfort").getAttribute("aria-valuenow")
  };

  document.getElementById("btn-evening").click();
  await wait(60);
  const evening = {
    active: document.getElementById("evening-overlay").classList.contains("active"),
    connection: document.getElementById("summary-connection")?.textContent,
    purpose: document.getElementById("summary-purpose")?.textContent,
    comfort: document.getElementById("summary-comfort")?.textContent,
    focus: document.activeElement?.id
  };
  document.getElementById("btn-end-day").click();
  await wait(60);
  const ended = {
    title: document.getElementById("evening-title")?.textContent?.trim(),
    button: document.getElementById("btn-end-day")?.textContent?.trim(),
    focus: document.activeElement?.id
  };
  document.getElementById("btn-end-day").click();
  await wait(80);
  const returned = {
    screen: document.querySelector(".screen.active")?.id,
    canvasCount: document.querySelectorAll("#sandbox-stage canvas").length,
    focus: document.activeElement?.id
  };
  return { journalOpened, shortcutOpened, ready, evening, ended, returned };
})()
'@
  if (-not $journalAndEvening.journalOpened.open -or $journalAndEvening.journalOpened.focus -ne "btn-journal-close") {
    throw "Mobile Journal did not open with correct focus."
  }
  if (-not $journalAndEvening.shortcutOpened.dialog -or $journalAndEvening.shortcutOpened.speaker -ne "Mdm Siti") {
    throw "Journal shortcut did not open the Shaded Route activity."
  }
  if (-not $journalAndEvening.shortcutOpened.focusIsChoice -or -not $journalAndEvening.ready.safeRouteDone) {
    throw "Journal activity choice did not complete."
  }
  if (-not $journalAndEvening.ready.eveningEnabled) {
    throw "Three activities did not unlock the evening."
  }
  if ($journalAndEvening.ready.connection -ne "4" -or $journalAndEvening.ready.purpose -ne "1" -or $journalAndEvening.ready.comfort -ne "3") {
    throw "Kampung Spirit meter totals were incorrect after three activities."
  }
  if (-not $journalAndEvening.evening.active -or $journalAndEvening.evening.focus -ne "btn-keep-exploring") {
    throw "Evening reflection did not open with correct focus."
  }
  if ($journalAndEvening.evening.connection -ne "4" -or $journalAndEvening.evening.comfort -ne "3") {
    throw "Evening summary did not reflect the sandbox state."
  }
  if ($journalAndEvening.ended.button -ne "Return to title" -or $journalAndEvening.ended.focus -ne "btn-end-day") {
    throw "End-day reflection did not reach its final state."
  }
  if ($journalAndEvening.returned.screen -ne "screen-title" -or $journalAndEvening.returned.canvasCount -ne 0) {
    throw "End-day exit did not destroy the sandbox and restore the title."
  }
  if ($journalAndEvening.returned.focus -ne "btn-start") {
    throw "Title focus was not restored after ending the day."
  }

  [ordered]@{
    initial = $initial
    noticeboard = $noticeboard
    nearMemory = $nearMemory
    memory = $memoryResult
    nearNoticeByTouch = $nearNoticeByTouch
    journalAndEvening = $journalAndEvening
  } | ConvertTo-Json -Depth 12
} finally {
  $socket.Dispose()
}
