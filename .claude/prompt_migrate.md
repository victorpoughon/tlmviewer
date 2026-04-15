I'm migrating scene elements from the old class based design to the new functional design. So far I have migrated successfully the AmbientLight element. Please migrate the DirectionalLight element. Your steps should roughly be:

1. Look at src/elements/AmbientLight.ts and relevant files to understand the new design
2. Create new file src/elements/DirectionalLight.ts
3. Write the new DirectionalLight implementation in src/elements/DirectionalLight.ts
4. Add DirectionalLight to the registry in src/elements/registry.ts
