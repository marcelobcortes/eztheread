<template>
  <div id="app">
    <h1>Ez The Read</h1>
    <Uploader 
      :connected="connected"
      :API_ENDPOINT="API_ENDPOINT"
      @setIoTConnection="setIoTConnection($event)"
    />
    <IoT
      :iot="iot"
      @iotConnected="iotConnected()"
      @iotMessageReceived="iotMessageReceived($event)"
    />
    <div v-if="hash">
      <WordsTable
        :firstWords="firstWords"
      />
    </div>
  </div>
</template>

<script>
import Uploader from './components/Uploader.vue'
import IoT from './components/IoT.vue'
import WordsTable from './components/WordsTable.vue'
// import objeto from './sampleWords.js'

export default {
  name: 'App',
  data() {
    return {
      iot: {},
      firstWords: [],
      hash: 1,
      connected: false,
      API_ENDPOINT: 'https://atnqoypvz2.execute-api.us-east-1.amazonaws.com'
    }
  },
  methods: {
    setIoTConnection (iotParams) {
      this.iot = iotParams;
    },
    iotConnected () {
      this.connected = true
    },
    iotMessageReceived (payload) {
      this.firstWords = payload.words
      this.hash = payload.hash
    }
  },
  components: {
    Uploader,
    IoT,
    WordsTable
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
