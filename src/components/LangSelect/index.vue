<template>
  <el-dropdown trigger="click" class="international" @command="handleSetLanguage">
    <div>
      <svg-icon class-name="international-icon" icon-class="zh_en" />
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :disabled="language==='zh'" command="zh">
        中文
      </el-dropdown-item>
      <el-dropdown-item :disabled="language==='en'" command="en">
        English
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import {mapGetters} from 'vuex'
import i18n from 'lang'
export default {
  computed: {
    ...mapGetters({
      language:'setting/language'
    }),
    basemessage() {
      return i18n.t('baseMessage.zh_en')
    }
  },
  methods: {
    handleSetLanguage(lang) {
      this.$i18n.locale = lang
      // location.reload()
      this.$store.dispatch('setting/setLanguage', lang)
      this.$baseMessage(this.basemessage,'success',1000)
    }
  }
}
</script>
