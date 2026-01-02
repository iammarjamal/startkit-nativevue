<script lang="ts" setup>
import { Application, type Button, type Label, type Page, type StackLayout, type TabView, type TabViewItem } from "@nativescript/core";
import Index from '@/components/index.vue';

</script>

<template>
  <Frame>
    <Page>
      <TabView androidTabsPosition="bottom" class="">
        <TabViewItem title="Home">
          <StackLayout class="p-2 m-4 gap-4">
            <Label class="text-[#ff3434] text-start text-2xl">عمار جمال</Label>

            <Label class="text-right" text="الوضع الحالي:" />
            <Label :text="`Store (User Preference): ${store}`" />
            <Label :text="`System: ${system}`" />
            <Label :text="`Resolved State: ${state}`" class="text-sm text-green-500" />

            <Button text="System Auto" class="text-black dark:text-white" @tap="setMode('auto')" />
            <Button text="Dark Mode" class="text-black dark:text-white" @tap="setMode('dark')" />
            <Button text="Light Mode" class="text-black dark:text-white" @tap="setMode('light')" />

            <Button @Tap="$navigateTo(Index)">Click Here to nav to Index Page fasd</Button>
          </StackLayout>
        </TabViewItem>

        <TabViewItem title="Settings">
          <StackLayout class="p-8">
            <Label class="bg-white dark:bg-red-600 text-2xl">مرحباً بالعالم انا عمار جمال</Label>
            <Label class="text-green-100 dark:text-red-400 text-4xl font-bold mb-4" text="Hello World Here !" />
            <Label class="text-gray-700" text="Configure your app settings here!" />
          </StackLayout>
        </TabViewItem>
      </TabView>
    </Page>
  </Frame>
</template>