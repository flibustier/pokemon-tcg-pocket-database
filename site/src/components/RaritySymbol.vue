<script setup lang="ts">
import { url, type Rarity } from "../lib/shared";

defineProps<{ rarity: Rarity }>();
</script>

<template>
  <span class="rarity" role="img" :aria-label="rarity.label" :title="rarity.label">
    <template v-if="rarity.image">
      <img v-for="i in rarity.count" :key="i" :src="url(`/images/rarities/${rarity.image}`)" alt="" />
    </template>
    <span v-else class="mono" aria-hidden="true">{{ rarity.label }}</span>
  </span>
</template>

<style scoped>
.rarity {
  display: inline-flex;
  align-items: center;
  gap: 0.08em;
  height: 1em;
  vertical-align: -0.1em;
}
img {
  height: 1em;
  width: auto;
}
</style>
