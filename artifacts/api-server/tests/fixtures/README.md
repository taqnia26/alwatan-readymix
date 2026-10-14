# Small generated video fixtures

These are original synthetic blue clips, not customer media. Both are two
seconds long at 64×64 and 10 fps, without audio (combined size under 3 KB).
They are committed so tests do not require ffmpeg or a network fixture download.

To regenerate from this directory:

```sh
ffmpeg -f lavfi -i color=c=blue:s=64x64:r=10:d=2 -an -c:v libvpx -b:v 30k -y playable.webm
ffmpeg -f lavfi -i color=c=blue:s=64x64:r=10:d=2 -an -c:v libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart -y h264.mp4
```
