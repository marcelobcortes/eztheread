<template>
    <div>
        <div v-if="!file">
            <h2>Select a PDF file</h2>
            <input type="file" accept="application/pdf" @change="onFileChange">
        </div>
        <div v-else>
            <button v-if="showUploadButton" @click="uploadPdf">Upload PDF file</button>
        </div>
        <h2 v-if="processing">Processing...</h2>
        <h2 v-if="uploaded">Uploaded!</h2>
        <div v-if="connected"></div>
    </div>
</template>

<script>
import axios from 'axios'
export default {
    name: 'Uploader',
    props: {
        connected: Boolean,
        API_ENDPOINT: String
    },
    data() {
        return {
            uploadUrl: '',
            showUploadButton: false,
            processing: false,
            uploaded: false,
            file: '',
            formData: '',
        }
    },
    async updated () {
        if (this.connected && !this.uploaded) {
            await axios.post(this.uploadUrl.url, this.formData, {})
            this.uploaded = true
            this.processing = false
        }
    },
    methods: {
        onFileChange (e) {
            let files = e.target.files || e.dataTransfer.files
            if (!files.length) return
            this.createFile(files[0])
            this.showUploadButton = true
        },
        createFile (file) {
            const reader = new FileReader()
            reader.onload = async (e) => {
                this.file = e.target.result
            }
            reader.readAsDataURL(file)
        },
        uploadPdf: async function () {
            this.processing = true
            this.showUploadButton = false
            
            // get upload URL
            // and IoT information
            const response = await axios({
                method: 'GET',
                url: this.API_ENDPOINT + '/uploads'
            })
            this.uploadUrl = response.data.uploadUrl

            let binary = atob(this.file.split(',')[1])
            let array = []
            for (var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i))
            }
            let blobData = new Blob([new Uint8Array(array)], {type: 'application/pdf'})
            const formData = new FormData()
            Object.keys(this.uploadUrl.fields).forEach((key) => {
                formData.append(key, this.uploadUrl.fields[key])
            })
            formData.append("file", blobData)
            this.formData = formData

            // connects to IoT endpoint before uploading
            this.$emit('setIoTConnection', response.data.iot)
            // uploads when prop 'connected' is true
        }
    }
}
</script>
