<script lang="ts" setup>
import type { Button, Label, Page, StackLayout, ActionBar, ActionItem, TabView, TabViewItem } from "@nativescript/core";
import { useColorMode } from '@/composables/useTheme';

const mode = useColorMode({ emitAuto: true });
const { store, system, state } = mode;

const setMode = (value: 'auto' | 'light' | 'dark') => {
  mode.value = value;
};

</script>

<template>
  <Frame>
    <Page :class="state" :statusBarStyle="state === 'light' ? 'dark' : 'light'"
      :androidStatusBarBackground="state === 'light' ? '#ffffff' : '#000000'">
      <TabView androidTabsPosition="bottom"
        :androidSelectedTabHighlightColor="state === 'light' ? '#ffffff' : '#000000'"
        :tabTextColor="state === 'light' ? '#000000' : '#ffffff'"
        :tabBackgroundColor="state === 'light' ? '#ffffff' : '#000000'">
        <TabViewItem title="Home" class="bg-white dark:bg-black">
          <StackLayout class="p-2 m-4 gap-4">
            <Label class="text-orange-200">اهلاً بالعالم هنا عمار</Label>

            <Label class="text-right" text="الوضع الحالي:" />
            <Label :text="`Store (User Preference): ${store}`" />
            <Label :text="`System: ${system}`" />
            <Label :text="`Resolved State: ${state}`" class="text-sm text-green-600" />

            <Button text="System Auto" class="text-black dark:text-white" @tap="setMode('auto')" />
            <Button text="Dark Mode" class="text-black dark:text-white" @tap="setMode('dark')" />
            <Button text="Light Mode" class="text-black dark:text-white" @tap="setMode('light')" />
          </StackLayout>
        </TabViewItem>

        <TabViewItem title="Settings" class="bg-white dark:bg-black">
          <StackLayout class="p-8">
            <Label class="bg-red-500">مرحباً بالعالم انا عمار جمال</Label>
            <Label class="text-green-100 dark:text-red-400 text-4xl font-bold mb-4" text="Hello World Here !" />
            <Label class="text-gray-700" text="Configure your app settings here!" />
          </StackLayout>
        </TabViewItem>
      </TabView>
    </Page>
  </Frame>
</template>