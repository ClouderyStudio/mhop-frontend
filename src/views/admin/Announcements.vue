<template>
  <div v-loading="loading">
    <div class="page-head">
      <h2 class="page-title">公告管理</h2>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon> 发布公告</el-button>
    </div>

    <!-- 窄屏：卡片列表 -->
    <div v-if="isMobile" class="admin-mobile-list">
      <div v-for="row in list" :key="row.id" class="admin-mobile-card mhop-card">
        <div class="am-head">
          <el-tag :type="row.is_active ? 'success' : 'info'" effect="plain" size="small">
            {{ row.is_active ? '展示中' : '已下架' }}
          </el-tag>
          <span v-if="row.sort > 0" class="am-sort">置顶 {{ row.sort }}</span>
          <span class="am-id">{{ fmtTime(row.created_at) }}</span>
        </div>
        <h3 class="am-ann-title">{{ row.title }}</h3>
        <p class="am-content">{{ row.content }}</p>
        <div class="am-actions">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.is_active ? 'warning' : 'success'" plain @click="toggleActive(row)">
            {{ row.is_active ? '下架' : '上架' }}
          </el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="!loading && list.length === 0" description="暂无公告" />
    </div>

    <!-- 宽屏：表格 -->
    <el-card v-else shadow="never">
      <el-table :data="list" stripe>
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }"><span class="cell-strong">{{ row.title }}</span></template>
        </el-table-column>
        <el-table-column label="内容" min-width="300">
          <template #default="{ row }"><p class="cell-text">{{ row.content.length > 80 ? row.content.slice(0, 80) + '…' : row.content }}</p></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" effect="plain" size="small">
              {{ row.is_active ? '展示中' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" align="center">
          <template #default="{ row }">{{ row.sort }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text @click="openEdit(row)">编辑</el-button>
            <el-button size="small" text :type="row.is_active ? 'warning' : 'success'" @click="toggleActive(row)">
              {{ row.is_active ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" text type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无公告，点击右上角发布第一条" />
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑公告' : '发布公告'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="公告标题，不超过 200 字" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="8" maxlength="5000" show-word-limit placeholder="公告正文内容" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" controls-position="right" />
          <span class="form-tip">数字越大越靠前展示</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" active-text="立即展示" inactive-text="暂不展示" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fmtTime } from '../../utils/format'
import { useIsMobile } from '../../utils/useIsMobile'
import {
  listAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../api/announcements'

const isMobile = useIsMobile()
const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const editing = ref(false)
const form = reactive({ id: null, title: '', content: '', is_active: true, sort: 0 })

async function load() {
  loading.value = true
  try {
    list.value = await listAllAnnouncements()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = false
  Object.assign(form, { id: null, title: '', content: '', is_active: true, sort: 0 })
  dialogVisible.value = true
}

function openEdit(row) {
  editing.value = true
  Object.assign(form, {
    id: row.id,
    title: row.title,
    content: row.content,
    is_active: row.is_active,
    sort: row.sort,
  })
  dialogVisible.value = true
}

async function save() {
  const title = form.title.trim()
  const content = form.content.trim()
  if (!title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!content) {
    ElMessage.warning('请填写内容')
    return
  }
  saving.value = true
  try {
    const payload = { title, content, is_active: form.is_active, sort: form.sort }
    if (editing.value) {
      await updateAnnouncement(form.id, payload)
      ElMessage.success('公告已更新')
    } else {
      await createAnnouncement(payload)
      ElMessage.success('公告已发布')
    }
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggleActive(row) {
  await updateAnnouncement(row.id, {
    title: row.title,
    content: row.content,
    is_active: !row.is_active,
    sort: row.sort,
  })
  ElMessage.success(row.is_active ? '已下架' : '已上架')
  load()
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确定删除公告「${row.title}」？此操作不可恢复。`, '删除公告', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteAnnouncement(row.id)
    ElMessage.success('已删除')
    load()
  } catch (e) {
    // 用户取消
  }
}

onMounted(load)
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.am-ann-title {
  margin: 8px 0 6px;
  font-size: 15px;
}
.am-content {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  margin: 0 0 10px;
}
.am-sort {
  font-size: 12px;
  color: var(--mhop-link);
}
.cell-strong {
  font-weight: 600;
}
.form-tip {
  margin-left: 10px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
</style>
