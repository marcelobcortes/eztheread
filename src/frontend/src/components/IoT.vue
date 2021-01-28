<template>
  <div></div>
</template>

<script>
export default {
  name: 'IoT',
  created () {
    const AWSIoTData = require('aws-iot-device-sdk')
    console.log('IoT component created')
    // let that = this

    const topic = '16a7327e-8a48-4775-a187-939b621e1bf0'

    const mqttClient = AWSIoTData.device({
      region: 'us-east-1',
      host: 'a8qu084ib8lgi-ats.iot.us-east-1.amazonaws.com',
      protocol: 'wss',
      accessKeyId: 'ASIAQJ3XZ3UQRKP22XPE',
      secretKey: 'JPYLTjn/06n85nkFZxElTc8ykw4AoNvM/KH/FzAN',
      sessionToken: 'FwoGZXIvYXdzEHoaDG3DjArLjvd6RUiJQiLIAZWIAVfDYtBqH9QWH+9hsmuo2xttkfA0nX0VDJFE/Tx+MkbtLjuXsjlbHVJqoDJJWzkwUUwLhWZ9E3QIKd84G5VFC1NUYbwB2WqadT0VjkrNu7HZ9BxioNk1xLrVF9Egjv5WMeEvemOhbs153TaBA0X7+0RaoROu5n3T/m7fWHRCIeaJuYcSFrOK6FPrIOXX07qfxmbOtcLt/yyZvbep3j0NUbVGID90iVEbYar7Tn1mRyVFRZZZ1ycZCrXzASantaxQxxHq2mHmKP+WyIAGMi0Syuws4eGEvurEpl7aWfaY7db5+EfM6RGXMQbbZzFhntaQDtTHLLXr4Gb5SY4='
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
      // Send the message back to parent component
      // that.$root.$emit('send', msg)
    })
  }
}
</script>
