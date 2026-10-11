import React from "react";
import {createRoot} from "react-dom/client";
import {Refine} from "@refinedev/core";
import {Today} from "./today";
import "./style.css";

// Minimal in-memory adapter for the UX spike. Production must use real auth,
// an authenticated backend and project-scoped access controls.
const demoProvider = {
  getList: async () => ({data: [],total: 0}),
  getOne: async () => ({data: {id: 1}}),
  create: async ({variables}: {variables: Record<string,unknown>}) => ({data: {id: Date.now(),...variables}}),
  update: async ({id,variables}: {id: string|number,variables: Record<string,unknown>}) => ({data: {id,...variables}}),
  deleteOne: async ({id}: {id: string|number}) => ({data: {id}}),
  getApiUrl: () => "",
} as any;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Refine dataProvider={demoProvider} options={{disableTelemetry:true}}>
      <Today/>
    </Refine>
  </React.StrictMode>
);
