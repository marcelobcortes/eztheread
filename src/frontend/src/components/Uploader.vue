<template>
    <div>
        <div v-if="!file">
            <h2>Select a PDF file</h2>
            <input type="file" accept="application/pdf" @change="onFileChange">
        </div>
        <div v-else>
            <button v-if="!uploadUrl" @click="uploadPdf">Upload PDF file</button>
        </div>
        <h2 v-if="uploadUrl">Success!</h2>
    </div>
</template>

<script>
import axios from 'axios';
export default {
    name: 'Uploader',
    data() {
        return {
            file: '',
            uploadUrl: '',
            API_ENDPOINT: 'https://5rgkuz4qdc.execute-api.us-east-1.amazonaws.com/uploads' // e.g. https://ab1234ab123.execute-api.us-east-1.amazonaws.com/uploads
        }
    },
    methods: {
        onFileChange (e) {
            let files = e.target.files || e.dataTransfer.files
            if (!files.length) return
            this.createFile(files[0])
        },
        createFile (file) {
            let reader = new FileReader()
            reader.onload = (e) => {
                this.file = e.target.result
            }
            reader.readAsDataURL(file)
        },
        uploadPdf: async function () {
            const response = await axios({
                method: 'GET',
                url: this.API_ENDPOINT
            })
            const uploadUrl = response.data.uploadUrl;
            console.log('Response: ', response)
            let binary = atob(this.file.split(',')[1])
            let array = []
            for (var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i))
            }
            let blobData = new Blob([new Uint8Array(array)], {type: 'application/pdf'})

            const formData = new FormData();
            Object.keys(uploadUrl.fields).forEach((key) => {
                formData.append(key, uploadUrl.fields[key])
            })
            formData.append("file", blobData)

            

            axios.post(uploadUrl.url, formData, {})
            
            // const xhr = new XMLHttpRequest();
            // xhr.open("POST", uploadUrl.url, true);
            // xhr.send(formData);

            this.uploadUrl = uploadUrl.url.split('?')[0]

            this.$emit('setIoTConnection', response.data.iot);
        }
    }
}
</script>
