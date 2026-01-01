import { Application } from "@nativescript/core";
import { createApp } from "nativescript-vue";
import Home from "./components/Home.vue";

// Application.setCssFileName("app.css");

createApp(Home).start();
