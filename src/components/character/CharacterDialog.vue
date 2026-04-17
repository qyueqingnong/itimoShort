<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 700px; max-width: 900px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="person" color="primary" size="md" class="q-mr-sm" />
        <div class="text-h6">{{ isEdit ? '编辑角色' : '新建角色' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator class="q-mt-md" />

      <q-card-section class="q-pa-lg">
        <div class="column">
          <!-- 第一行：姓名和角色定位 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-6">
              <q-input
                v-model="formData.name"
                label="姓名 *"
                outlined
                dense
                maxlength="10"
                counter
                :rules="[
                  (val) => !!val || '请输入姓名',
                  (val) => (val.length >= 1 && val.length <= 10) || '姓名长度为1-10个字符',
                ]"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="formData.role"
                :options="roleOptions"
                label="角色定位 *"
                outlined
                dense
                :rules="[(val) => !!val || '请选择角色定位']"
              />
            </div>
          </div>

          <!-- 第二行：性别和年龄 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-6">
              <q-select
                v-model="formData.gender"
                :options="genderOptions"
                label="性别"
                outlined
                dense
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="formData.age"
                label="年龄"
                outlined
                dense
                type="number"
                suffix="岁"
                :rules="[
                  (val) =>
                    val === '' || val === null || (val >= 1 && val <= 120) || '年龄范围为1-120岁',
                ]"
              />
            </div>
          </div>

          <!-- 第三行：身高和体重 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-6">
              <q-input
                v-model.number="formData.height"
                label="身高"
                outlined
                dense
                type="number"
                suffix="cm"
                :rules="[
                  (val) =>
                    val === '' || val === null || (val >= 50 && val <= 250) || '请输入合理的身高',
                ]"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="formData.weight"
                label="体重"
                outlined
                dense
                type="number"
                suffix="kg"
                :rules="[
                  (val) =>
                    val === '' || val === null || (val >= 20 && val <= 300) || '请输入合理的体重',
                ]"
              />
            </div>
          </div>

          <!-- 第四行：身份 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-12">
              <q-input
                v-model="formData.identity"
                label="身份"
                outlined
                dense
                placeholder="例如：学生、医生、警察"
              />
            </div>
          </div>

          <!-- 第五行：体型 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-12">
              <q-input
                v-model="formData.bodyType"
                label="体型"
                outlined
                dense
                placeholder="例如：匀称、健壮、纤细"
              />
            </div>
          </div>

          <!-- 面容特征 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-12">
              <q-input
                v-model="formData.facialFeatures"
                label="面容特征"
                outlined
                dense
                type="textarea"
                :rows="2"
                placeholder="描述面部特征，如：五官精致、浓眉大眼等"
              />
            </div>
          </div>

          <!-- 服饰外观 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-12">
              <q-input
                v-model="formData.clothing"
                label="服饰外观"
                outlined
                dense
                type="textarea"
                :rows="2"
                placeholder="描述常见服饰风格，如：休闲装、正装、古装等"
              />
            </div>
          </div>

          <!-- 性格 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-12">
              <q-input
                v-model="formData.personality"
                label="性格"
                outlined
                dense
                type="textarea"
                :rows="2"
                placeholder="例如：开朗活泼、沉稳内敛"
              />
            </div>
          </div>

          <!-- 说话方式 -->
          <div class="row q-col-gutter-lg q-mb-md">
            <div class="col-12">
              <q-input
                v-model="formData.speakingStyle"
                label="说话方式"
                outlined
                dense
                type="textarea"
                :rows="2"
                placeholder="例如：语速较快、用词文雅"
              />
            </div>
          </div>

          <!-- 兴趣与特长 -->
          <div class="row q-col-gutter-lg">
            <div class="col-12">
              <q-input
                v-model="formData.interests"
                label="兴趣与特长"
                outlined
                dense
                type="textarea"
                :rows="2"
                placeholder="例如：喜欢阅读、擅长绘画"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="取消" color="grey-7" v-close-popup />
        <q-btn unelevated label="保存" color="primary" @click="onSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import type { Character } from 'src/core/types/project';

interface Props {
  character?: Character;
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const isEdit = !!props.character;

const roleOptions = ['主角', '配角', '次要角色'];
const genderOptions = ['男', '女'];

const formData = ref<Omit<Character, 'id' | 'createdAt' | 'updatedAt'> & { clothing?: string }>({
  name: props.character?.name ?? '',
  description: props.character?.description ?? '',
  role: props.character?.role ?? '配角',
  gender: props.character?.gender ?? '',
  age: props.character?.age ?? '',
  height: props.character?.height ?? '',
  weight: props.character?.weight ?? '',
  bodyType: props.character?.bodyType ?? '',
  facialFeatures: props.character?.facialFeatures ?? '',
  identity: props.character?.identity ?? '',
  personality: props.character?.personality ?? '',
  speakingStyle: props.character?.speakingStyle ?? '',
  interests: props.character?.interests ?? '',
});

function onSave() {
  if (!formData.value.name.trim() || !formData.value.role) {
    return;
  }

  // 验证姓名长度
  if (formData.value.name.length < 1 || formData.value.name.length > 10) {
    return;
  }

  // 验证年龄
  if (formData.value.age && (Number(formData.value.age) < 1 || Number(formData.value.age) > 120)) {
    return;
  }

  // 验证身高
  if (
    formData.value.height &&
    (Number(formData.value.height) < 50 || Number(formData.value.height) > 250)
  ) {
    return;
  }

  // 验证体重
  if (
    formData.value.weight &&
    (Number(formData.value.weight) < 20 || Number(formData.value.weight) > 300)
  ) {
    return;
  }

  const characterData: Character = {
    id: props.character?.id ?? `char_${Date.now()}`,
    ...formData.value,
    createdAt: props.character?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  onDialogOK(characterData);
}
</script>
