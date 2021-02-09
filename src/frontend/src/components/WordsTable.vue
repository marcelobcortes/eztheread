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

a {
    padding: 1em;
    border: 2px solid cornflowerblue;
    border-radius: 3px;
    background-color: #f9f9f9;
}

a:hover {
    background-color: aliceblue;
}
</style>

<template>
    <div>
        <div v-if="words.length > 0" class="container">
            <div class="pagination">
                <a href="">Previous</a>
            </div>
            <table class="blue-border">
                <tbody v-if="window.width < 650">
                    <tr v-for="i in 30" :key="i">
                        <td class="cell">
                            {{ words[i-1].word }}
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr v-for="i in 10" :key="i">
                        <td class="cell" v-for="j in 3" :key="j">
                            {{ words[((i-1)*3) + (j-1)].word }}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination">
                <a href="">Next</a>
            </div>
        </div>
        <div v-if="firstWords"/>
    </div>
</template>

<script>
export default {
    name: 'WordsTable',
    props: {
        firstWords: Array
    },
    data: function () {
        return {
            words: [],
            window: {
                width: 0,
                height: 0,
            }
        }
    },
    updated () {
        if (this.words.length == 0) {
            this.words = this.firstWords
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
        }
    }
}
</script>