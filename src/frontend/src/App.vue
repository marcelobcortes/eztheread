<template>
  <div id="app">
    <IoT />
  </div>
</template>

<script>
import IoT from './components/IoT.vue'

export default {
  name: 'App',
  components: {
    IoT
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
