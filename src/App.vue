<template>
  <v-app class="tudo">
    <router-view />
  </v-app>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
.tudo {
  background-color: #f44336 !important;
  overflow: hidden !important;
  text-shadow: 2px 2px rgba(0, 0, 0, 0.15);
}
</style>
