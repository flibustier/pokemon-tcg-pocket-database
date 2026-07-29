.PHONY: packs

packs:
	@find dist/images/packs -type f -name '*.webp' -print0 | while IFS= read -r -d '' file; do \
		tmp="$$file.tmp"; \
		magick "$$file" -gravity center -crop 160x256+0+0 +repage "$$tmp" && mv "$$tmp" "$$file"; \
	done
