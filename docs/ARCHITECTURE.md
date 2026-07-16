# Architecture

The addon boundary is the provider configuration and extractor. `createProviderAddon(providerId)` builds a unique manifest, catalog namespace, content-ID prefix, catalog handler, metadata handler, and stream handler. The Vercel router selects that isolated instance from the first URL segment. Local workspace commands run the same instance without a path prefix.

All 29 distinct providers in the current `plugins.json` + `BLxplugins.json` registry union are selected. None are omitted. The old Nuvio hybrid manifest and duplicated `repo/` snapshot were removed because they were incompatible with the individual-addon goal.
