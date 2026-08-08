# Character Personas — portrait prompts for Miora

## Purpose

One copy-paste prompt per character, for generating portrait art in
[miora.design](https://miora.design). Companion to `docs/MIORA_ASSET_BIBLE.md`,
which owns the shared art direction, camera and palette — read that first and do
not restate it in a prompt.

**19 characters: 18 residents who walk the village, plus the Voice.**

Every persona below is derived from what the game already ships — the traits and
role in `src/game/campaignContent.ts`, and the build, hair, outfit, accessory and
exact colours in `src/game/characterArt.ts`. They are not invented descriptions.
If you change a persona here, change the sprite too, or the portrait and the
character walking around will disagree.

## Before you generate

**Three things that will bite otherwise.**

1. **Match the sprite attributes.** Build, hair style, outfit and accessory are
   rendered in code today. A portrait of Mr. Long without his cane, or Auntie
   Minah without her apron, contradicts the character on screen.
2. **Use the listed hex values** for shirt, hair and skin. They are the sprite's
   actual colours, so a portrait built on them reads as the same person.
3. **The deck currently claims the title panorama is the only image asset.**
   Adding portraits changes that. When you ship them, update the Credits panel
   in `index.html` (`title-view-credits`) and the art note in `AGENTS.md`. That
   claim is published — leaving it stale is a defect.

Ethnicity in each persona is read from the character's name in the Singaporean
convention. It is an editorial call, not something the code encodes — change it
freely if you would rather it read differently.

## Shared prompt prefix

Paste this ahead of any persona so the whole cast reads as one set.

```
Character portrait, bust framing, facing slightly toward the viewer, warm
sunlit contemporary Singapore kampung setting softly blurred behind. Warm 2D
storybook style with pixel-inspired edges, simplified geometry, tactile
painted texture and a strong readable silhouette. Deep teal outline #173F4F,
warm cream #FFF6DC. Light from the upper left. Calm, dignified, lived-in.
No text, no logos, no watermark, no UI frame.
```

Then append one persona block below.

## The three story elders

These three carry the campaign. They deserve the most attention.

### Mr. Long — Chapter 1

> Long-time resident and radio repairer · independent, careful, dry-humoured

```
A short, wiry Singaporean Chinese man in his late seventies with a receding
head of silver-grey hair #B6B0A7 and warm tan skin #D6A177, wearing a striped
short-sleeve shirt in muted slate blue #5B748F, both hands resting on a wooden
walking cane. Dry-humoured, independent eyes that do not want to be pitied.
```

### Grandma Ros — Chapter 2

> Neighbourhood cooking teacher · assured, warm, exact

```
A warm, broad-framed Malay-Singaporean grandmother in her seventies with
grey hair #B3ADA5 in a neat bun and deep brown skin #A8703F, wearing a floral
baju in terracotta #C76B52 under a well-used cooking apron. Assured and exact,
the expression of someone who has fed this whole village and been forgotten.
```

### Mr. Tan — Chapter 3

> Rattan craftsman · measured, inventive, patient

```
A tall, measured Chinese-Singaporean craftsman in his seventies with
side-parted grey hair #827D77 and tan skin #CF9A6C, wearing reading glasses
and an olive work vest #596D55 with rattan strips in the chest pocket. Patient,
inventive, hands that still know more than they can lift.
```

## The elders of the village

### Aunty Mei

> Community garden mentor · observant, plain-spoken, generous

```
A wide-built Chinese-Singaporean woman in her late sixties with grey-brown hair
#6B6560 in a bun and light tan skin #E3B58C, wearing a floral blouse in dusty
rose-red #C85C5C under a gardening apron, a sprig of herbs in one hand.
Observant and plain-spoken.
```

### Uncle Ravi

> Void-deck social organiser · welcoming, wry, persistent

```
A tall Indian-Singaporean man in his late sixties with silver receding hair
#B0AAA0 and warm brown skin #B87F52, wearing wire-rimmed glasses, a neat
collared shirt in deep teal #3D7A80, and a canvas tote over one shoulder.
Welcoming and wry, mid-sentence.
```

### Mdm Siti

> Neighbourhood access expert · precise, patient, quietly funny

```
A short, precise Malay-Singaporean woman in her seventies with a dark bob
#4C3B5F and tan skin #CF9A6C, wearing a floral tunic in soft violet #7B5AA6
and resting on a walking cane. Patient, with a quietly funny expression.
```

### Uncle Seng

> Kopitiam connector · steady, dry-humoured, attentive

```
A short, steady Chinese-Singaporean man in his late sixties with thinning
silver hair #A7A198 and fair tan skin #E8C49B, wearing thick glasses and a
striped polo in warm ochre-brown #8A6B3D, a small coffee cup in hand. Attentive,
the sort who leaves one chair turned outward.
```

### Auntie Minah

> Provision-shop keeper · resourceful, neighbourly, direct

```
A resourceful, broad-shouldered Malay-Singaporean shopkeeper in her sixties
with black hair #2A2523 in a bun under a headscarf and deep brown skin #A8703F,
wearing a floral dress in forest green #2F7D5F under a shop apron. Direct and
neighbourly, mid-conversation across a counter.
```

## The adults

### Pak Yusof

> Estate fixer · practical, unshowy, methodical

```
A sturdy, wide-built Malay-Singaporean man in his fifties with greying
side-parted hair #8C8580 and tan skin #CF9A6C, wearing a practical work vest in
denim blue #4A6FA5 with a tool tote at his side. Unshowy and methodical, always
halfway through a repair.
```

### Coach Meng

> Volunteer organiser · energetic, inclusive, organised

```
A tall, energetic Chinese-Singaporean man in his forties with a short crop
#5A5550 and light tan skin #E3B58C, wearing a bright collared sports shirt in
warm amber #D98A3C, caught mid-gesture organising a circle. Inclusive; makes
room before he makes rules.
```

## The young neighbours

The story asks the player to convince these six. They matter as much as the
elders — the thesis is intergenerational, not elder-only.

### Wei Ling

> Newer resident and intergenerational connector · curious, thoughtful, gently candid

```
A tall young Chinese-Singaporean woman in her twenties with a sleek black bob
#241F1C and fair skin #ECC6A0, wearing a plain everyday top in dusty pink
#C76A9A with a shoulder tote. Curious and gently candid, listening more than
speaking.
```

### Hafiz

> Football regular at the void deck · easygoing, practical, always mid-errand

```
A tall, easygoing Malay-Singaporean man in his early twenties with black hair
#241F1D under a backwards cap and warm brown skin #B87F52, wearing a football
tee in teal #2F7D8C. Relaxed, clearly on his way somewhere.
```

### Jia En

> Secondary school student · curious, blunt, observant

```
A short, blunt Chinese-Singaporean secondary-school student with black hair
#2A2523 in a high ponytail and light tan skin #E3B58C, wearing a school tee in
warm coral #D4674F and a heavy backpack. Observant and unimpressed — about to
ask the question everyone is avoiding.
```

### Arun

> Delivery rider · restless, kind, quick

```
A tall, restless young Indian-Singaporean delivery rider in his twenties with
short curly black hair #1F1A17 and deep brown skin #8D5A3B, wearing a sage
green hoodie #6F8F5A with an insulated delivery bag slung across his back.
Quick and kind, permanently three minutes late.
```

### Nadia

> Nursing student · warm, direct, tired

```
A short, warm Malay-Singaporean nursing student in her twenties with dark
brown hair #3A2A20 in a ponytail and tan skin #CF9A6C, wearing a soft violet
tee #7B5AA6 with a canvas bag. Direct and visibly tired — the one who notices
who has stopped coming outside.
```

### Kai

> Lives on the third floor · loud, fearless, eleven

```
A small, loud eleven-year-old Singaporean Chinese boy with black hair #2A2523
under a sideways cap and tan skin #D39C6D, wearing a bright mustard hoodie
#D9A53C. Fearless and grinning; knows every shortcut in the village.
```

### Priya

> Primary school teacher · patient, organised, quietly stubborn

```
A tall, patient young Indian-Singaporean primary school teacher in her late
twenties with curly black hair #241A14 and warm brown skin #B87F52, wearing a
bright tee in rose-red #C85C5C and a backpack of marking. Organised and quietly
stubborn.
```

### Ben — Chapter 3

> Maker and neighbour · reserved, skilled, deliberate

```
A tall, reserved young Chinese-Singaporean man in his twenties with a short
black crop #2A2523 and warm tan skin #D6A177, wearing a plain shirt in muted
indigo #5E698A, carrying a tote of half-finished projects. Deliberate and
skilled — the craftsman's grandson who never dared ask to be taught.
```

## The Voice

Not a resident. No sprite exists, and it should not read as a person — the
ending reveals it is the player's own faded reflection.

```
A softly luminous, translucent human figure with no fixed facial features, warm
cream light #FFF6DC bleeding out at the silhouette's edges, dissolving toward
the extremities. Patient and fading. Not a ghost and not menacing — familiar,
like a memory of someone standing in a doorway.
```

## Quick reference

| Character | Generation | Build | Hair | Outfit | Accessory | Shirt | Hair | Skin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mr. Long | elder | short | receding | striped | cane | `#5B748F` | `#B6B0A7` | `#D6A177` |
| Grandma Ros | elder | wide | bun | floral | apron | `#C76B52` | `#B3ADA5` | `#A8703F` |
| Mr. Tan | elder | tall | side-part | work-vest | glasses | `#596D55` | `#827D77` | `#CF9A6C` |
| Aunty Mei | elder | wide | bun | floral | apron | `#C85C5C` | `#6B6560` | `#E3B58C` |
| Uncle Ravi | elder | tall | receding | collared | glasses | `#3D7A80` | `#B0AAA0` | `#B87F52` |
| Mdm Siti | elder | short | bob | floral | cane | `#7B5AA6` | `#4C3B5F` | `#CF9A6C` |
| Uncle Seng | elder | short | receding | striped | glasses | `#8A6B3D` | `#A7A198` | `#E8C49B` |
| Auntie Minah | elder | wide | bun | floral | apron | `#2F7D5F` | `#2A2523` | `#A8703F` |
| Pak Yusof | adult | wide | side-part | work-vest | none | `#4A6FA5` | `#8C8580` | `#CF9A6C` |
| Coach Meng | adult | tall | crop | collared | none | `#D98A3C` | `#5A5550` | `#E3B58C` |
| Wei Ling | young | tall | bob | plain | none | `#C76A9A` | `#241F1C` | `#ECC6A0` |
| Hafiz | young | tall | crop | tee | cap | `#2F7D8C` | `#241F1D` | `#B87F52` |
| Jia En | young | short | ponytail | tee | backpack | `#D4674F` | `#2A2523` | `#E3B58C` |
| Arun | young | tall | curly | hoodie | none | `#6F8F5A` | `#1F1A17` | `#8D5A3B` |
| Nadia | young | short | ponytail | tee | none | `#7B5AA6` | `#3A2A20` | `#CF9A6C` |
| Kai | young | short | crop | hoodie | cap | `#D9A53C` | `#2A2523` | `#D39C6D` |
| Priya | young | tall | curly | tee | backpack | `#C85C5C` | `#241A14` | `#B87F52` |
| Ben | young | tall | crop | plain | none | `#5E698A` | `#2A2523` | `#D6A177` |
| The Voice | — | — | — | — | — | — | — | — |

Cast balance as shipped: **8 young, 2 adult, 8 elder.** Keep it that way when
generating — an elder-only portrait set would undercut the intergenerational
thesis the whole campaign rests on.

## Where these live in code

| What | Where |
| --- | --- |
| Traits, role, dialogue | `src/game/campaignContent.ts` (`NPC_PROFILES`) |
| Build, hair, outfit, colours | `src/game/characterArt.ts` (`RESIDENT_ART`) |
| Current code-drawn portraits | `src/game/campaignPortrait.ts` |
| Name list | `src/game/campaignTypes.ts` (`NpcId`) |
