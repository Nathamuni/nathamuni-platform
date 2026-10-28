#!/usr/bin/env bash
# Regenerates the per-theme hero art from the two violet originals:
#   public/images/generated/hero-bg.jpg        -> hero-bg-<theme>.jpg
#   public/images/generated/about-portrait.jpg -> about-portrait-<theme>.jpg
#
# Not part of `npm run build` (needs ffmpeg; the outputs are committed). Run by hand
# after changing a palette or replacing an original:  bash scripts/make-theme-art.sh
#
# Recolouring is a channel mix, not a hue rotation: the aurora spans cyan..magenta, so
# rotating the hue keeps that whole spread and every theme comes out a rainbow. Mixing
# maps the cool tones onto one target palette instead. NOTE colorchannelmixer defaults
# the diagonal gains (rr, gg, bb) to 1, so each recipe sets all nine values explicitly.
#
# The portrait is only recoloured where the original is strongly blue (the backdrop
# glow): skin, hair and the black shirt are left exactly as shot.
set -euo pipefail
cd "$(dirname "$0")/../public/images/generated"

declare -A MIX=(
  [ocean]="rr=0.1:rg=0:rb=0:gr=0:gg=0.8:gb=0.3:br=0:bg=0:bb=1"
  [ember]="rr=0.2:rg=0:rb=1:gr=0.25:gg=0.45:gb=0:br=0:bg=0:bb=0"
  [forest]="rr=0.1:rg=0.2:rb=0:gr=0:gg=0:gb=0.9:br=0.35:bg=0.35:bb=0"
  [rose]="rr=0:rg=0:rb=1:gr=0:gg=0.15:gb=0.1:br=0.6:bg=0:bb=0.3"
  [gold]="rr=0.1:rg=0:rb=1:gr=0:gg=0.2:gb=0.68:br=0.05:bg=0:bb=0"
  [crimson]="rr=0.2:rg=0:rb=1:gr=0.08:gg=0.1:gb=0:br=0.05:bg=0:bb=0"
  [teal]="rr=0:rg=0:rb=0:gr=0.2:gg=0.35:gb=0.7:br=0:bg=0.2:bb=0.7"
  [berry]="rr=0.5:rg=0:rb=0.8:gr=0:gg=0:gb=0.05:br=0:bg=0:bb=0.75"
  [sunset]="rr=0:rg=0:rb=1:gr=0.3:gg=0.55:gb=0:br=0.55:bg=0:bb=0"
  [slate]="rr=0.3:rg=0.59:rb=0.11:gr=0.3:gg=0.59:gb=0.11:br=0.32:bg=0.62:bb=0.16"
  [sapphire]="rr=0.05:rg=0:rb=0.2:gr=0:gg=0.3:gb=0.25:br=0.1:bg=0:bb=1"
)
W="clip((b(X,Y)-r(X,Y)-12)*5,0,255)"
# Variants are deliberately a little darker and calmer than the violet original: the channel
# mix alone keeps its brightest highlights, which reads as neon on a warm or green palette.
TONE="eq=saturation=0.62:brightness=-0.04:gamma=0.82"

for id in "${!MIX[@]}"; do
  m=${MIX[$id]}
  ffmpeg -v error -y -i hero-bg.jpg -vf "colorchannelmixer=$m,$TONE" -q:v 3 "hero-bg-$id.jpg"
  ffmpeg -v error -y -i about-portrait.jpg -filter_complex \
    "[0]format=gbrp,split=3[o][c][m];[c]colorchannelmixer=$m,$TONE[cc];[m]geq=r='$W':g='$W':b='$W'[mk];[o][cc][mk]maskedmerge,format=yuvj420p" \
    -q:v 3 "about-portrait-$id.jpg"
  echo "built $id"
done
