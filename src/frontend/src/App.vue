<template>
  <div id="app">
    <h1>Ez The Read</h1>
    <Uploader @setIoTConnection="setIoTConnection($event)" />
    <IoT :iot="iot" />
  </div>
</template>

<script>
import Uploader from './components/Uploader.vue'
import IoT from './components/IoT.vue'

export default {
  name: 'App',
  data() {
    return {
      iot: {}
    }
  },
  methods: {
    setIoTConnection (iotParams) {
      this.iot = iotParams;
    }
  },
  components: {
    Uploader,
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
