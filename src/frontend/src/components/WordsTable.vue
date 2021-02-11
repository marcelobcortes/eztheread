<style>
.container {
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.blue-border {
  border: 2px solid cornflowerblue;
  border-radius: 3px;
}

.cell {
  background-color: #f9f9f9;
  min-width: 5em;
  padding: 8px 30px;
}

.cell:hover {
    background-color: aliceblue;
    cursor: pointer;
}

.pagination {
    padding: 1em;
    padding-top: 10em;
}

.pagination-control {
    padding: 1em;
    border: 2px solid cornflowerblue;
    border-radius: 3px;
    background-color: #f9f9f9;
}

.pagination-control:hover {
    background-color: aliceblue;
    cursor: pointer;
}

.disabled:hover {
    cursor: not-allowed;
}
</style>

<template>
    <div>
        <div v-if="words.length > 0" class="container">
            <div class="pagination">
                <span v-if="!disablePreviousPage" class="pagination-control" @click="previousPage()">Previous</span>
                <span v-else class="pagination-control disabled">Previous</span>
            </div>
            <table class="blue-border">
                <tbody v-if="window.width < 650">
                    <tr v-for="i in 30" :key="i">
                        <td class="cell">
                            <span v-if="words[currentPage][i-1]">
                                {{ words[currentPage][i-1].word }}
                            </span>
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr v-for="i in 10" :key="i">
                        <td class="cell" v-for="j in 3" :key="j">
                            <span v-if="words[currentPage][((i-1)*3) + (j-1)]">
                                {{ words[currentPage][((i-1)*3) + (j-1)].word }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination">
                <span v-if="!disableNextPage" class="pagination-control" @click="nextPage()">Next</span>
                <span v-else class="pagination-control disabled">Next</span>
            </div>
        </div>
        <div v-if="firstWords"/>
    </div>
</template>

<script>
import axios from 'axios'
export default {
    name: 'WordsTable',
    props: {
        firstWords: Array,
        API_ENDPOINT: String
    },
    data: function () {
        return {
            words: [],
            currentPage: 0,
            lastPage: null,
            disablePreviousPage: true,
            disableNextPage: false,
            window: {
                width: 0,
                height: 0,
            }
        }
    },
    updated () {
        if (this.words.length == 0) {
            this.words= [this.firstWords]
        }
    },
    created() {
        this.words = this.firstWords
        window.addEventListener('resize', this.handleResize)
        this.handleResize()
    },
    destroyed() {
        window.removeEventListener('resize', this.handleResize)
    },
    methods: {
        handleResize() {
            this.window.width = window.innerWidth
            this.window.height = window.innerHeight
        },
        previousPage() {
            this.disableNextPage = false
            if (--this.currentPage === 0) {
                this.disablePreviousPage = true
            }
        },
        async nextPage() {
            this.disablePreviousPage = false
            this.disableNextPage = true

            if (!this.words[this.currentPage+1]) {
                const currentPageWords = this.words[this.currentPage]
                const hash = currentPageWords[currentPageWords.length - 1].hash
                const offset = currentPageWords[currentPageWords.length - 1].frequency
                const response = await axios({
                    method: 'GET',
                    url: this.API_ENDPOINT + '/words/' + hash + '?offset=' + offset,
                })
                const newPageWords = response.data.words

                this.disableNextPage = false
                if (newPageWords.length > 0) {
                    this.currentPage++
                    if (currentPageWords.length > newPageWords.length) {
                        this.lastPage = this.currentPage
                        this.disableNextPage = true
                    }
                    this.words[this.currentPage] = newPageWords
                }
            } else {
                this.currentPage++
                this.disableNextPage = false
                if (this.currentPage == this.lastPage) {
                    this.disableNextPage = true
                }
            }
        }
    }
}
</script>