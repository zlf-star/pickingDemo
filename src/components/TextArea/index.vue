<template>
  <div>
    <el-input v-model="textAreaVal" class="text-area" type="textarea" clearable :rows="row" @input="handleInputChange" />
    <span class="remain-word">{{ valueLength }}/{{ maxLength }}</span>
  </div>
</template>

<script>
const isEmpty = (str) => {
  if (str === '' || str === undefined || str === null) {
    return true
  }
  return false
}

export default {
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    row: {
      type: Number,
      default: 3
    },
    maxLength: {
      type: Number,
      default: 512
    }
  },
  data() {
    return {
      textAreaVal: ''
    }
  },
  computed: {
  	// 计算当前文本框中内容的字数
    valueLength() {
      if (isEmpty(this.textAreaVal)) {
        return 0
      }
      return this.textAreaVal.length
    }
  },
  watch: {
  	// 监听value的变化
    value: {
      handler(val, oldVal) {
        this.textAreaVal = val
      },
      immediate: true
    }
  },
  methods: {
  	// 计算textAreaVal值，超过最大值则直接截断
    handleInputChange() {
      this.textAreaVal = this.textAreaVal.substring(0, this.maxLength)
      this.$emit('change', this.textAreaVal)
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .text-area {
  padding-bottom: 24px;
  border: 1px solid;
  border-color: #dcdfe6;
  border-radius: 4px;
  .el-textarea__inner {
    border: none;
  }
}

.remain-word {
  position: absolute;
  right: 10px;
  bottom: -8px;
}
</style>

