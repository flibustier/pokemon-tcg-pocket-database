for f in dist/images/cards/*.webp; do 
    filename="$(basename "$f")"; 
    magick "$f" -interlace plane -strip -quality 85 -resize 208x290 -sharpen 0x0.5 "dist/images/thumbnails/$filename"; 
done
