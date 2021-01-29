<template>
  <div v-if="iot"></div>
</template>

<script>
export default {
  name: 'IoT',
  props: {
    iot: Object
  },
  updated () {
    const AWSIoTData = require('aws-iot-device-sdk')

    const topic = this.iot.topic

    const mqttClient = AWSIoTData.device({
      region: this.iot.region,
      host: this.iot.iotEndpoint,
      protocol: 'wss',
      accessKeyId: this.iot.accessKey,
      secretKey: this.iot.secretKey,
      sessionToken: this.iot.sessionToken
    })

    mqttClient.on('connect', () => {
      console.log('mqttClient connected')
      mqttClient.subscribe(topic)
    })

    mqttClient.on('error', (err) => {
      console.log('mqttClient error:', err)
    })

    mqttClient.on('close', (err, a) => {
      console.log('mqttClient close:', err, a)
    })

    mqttClient.on('disconnect', (err) => {
      console.log('mqttClient disconnect:', err)
    })

    mqttClient.on('message', (topic, payload) => {
      const msg = JSON.parse(payload.toString())
      console.log('mqttClient message: ', msg)
    })
  }
}
</script>
