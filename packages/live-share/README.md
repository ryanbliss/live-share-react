# Microsoft Live Share

Easily create a collaboration app in Teams with [Fluid Framework](https://fluidframework.com/).

You can find our API reference documentation at [aka.ms/livesharedocs](https://aka.ms/livesharedocs).

## Installing

To add the latest version of the SDK to your application using NPM:

```bash
npm install @microsoft/live-share --save
```

or using [Yarn](https://yarnpkg.com/):

```bash
yarn add @microsoft/live-share
```

## Building the extension

After cloning the [GitHub repository](https://www.github.com/microsoft/live-share-sdk), navigate to the root folder and perform:

```bash
npm install --legacy-peer-dep
npm run build
```

This will use lerna to hoist and build all dependencies.

## How to use this extension

- This package depends on [Teams JS SDK](https://docs.microsoft.com/en-us/javascript/api/overview/msteams-client?view=msteams-client-js-latest). The version of `@microsoft/teams-js` you use in your app must match the one used in this project.

```javascript

import { ... } from "fluid-framework";
import { TeamsFluidClient } from "@microsoft/live-share";
import * as microsoftTeams from "@microsoft/teams-js";

// Initialize Teams Client SDK
await microsoftTeams.app.initialize();

// Define Fluid schema
const schema = {
    // Your initial SharedObject for your app
    initialObjects: {
        exampleMap: SharedMap,
        ...,
    },
};
// create space based on Teams context
const client = new TeamsFluidClient();
const { container } = await client.joinContainer(schema);

...
// listen to and send events on container.initialObjects.<DDS>
...
```

## Code samples

| Sample name | Description                                                            | Javascript                                  |
| ----------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| Dice Roller | Enable all connected clients to roll a dice and view the result.       | [View](https://aka.ms/liveshare-diceroller) |
| Agile Poker | Enable all connected clients to play an Agile Poker planning activity. | [View](https://aka.ms/liveshare-agilepoker) |

## Package Compatibility

The Live Share SDK contains dependencies for [@microsoft/teams-js](https://www.npmjs.com/package/@microsoft/teams-js) and [fluid-framework](https://www.npmjs.com/package/fluid-framework) packages among others. Both of these packages are sensitive to the package version your app any libraries use. You will likely run into issues if the package version your app uses doesn't match the version other libraries you depend on use.

**It is critical that your app use the package dependencies listed in the table below.** Lookup the version of the `@microsoft/live-share` you're using and set any other dependencies in your package.json file to match:

| @microsoft/live-share | @microsoft/teams-js  | fluid-framework | @microsoft/live-share-media | @fluidframework/azure-client | @microsoft/TeamsFx              | @microsoft/TeamsFx-react        |
| --------------------- | -------------------- | --------------- | --------------------------- | ---------------------------- | ------------------------------- | ------------------------------- |
| ~0.4.0                | 2.0.0-experimental.1 | ~1.2.3          | ~0.4.0 (optional)           | ~1.0.2 (optional)            | 2.0.0-experimental.1 (optional) | 2.0.0-experimental.1 (optional) |
| ~0.3.1                | 2.0.0-experimental.0 | ~0.59.0         | ~0.3.1 (optional)           | ~0.59.0 (optional)           | 2.0.0-experimental.0 (optional) | 2.0.0-experimental.0 (optional) |

## Contributing

There are several ways you can [contribute](../../CONTRIBUTING.md) to this project:

- [Submit bugs](https://github.com/microsoft/live-share-sdk/issues) and help us verify fixes as they are checked in.
- Review the source code changes.
- Engage with other Live Share developers on [StackOverflow](https://stackoverflow.com/questions/tagged/live-share).
- [Contribute bug fixes](../../CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact opencode@microsoft.com with any additional questions or comments.

## Reporting Security Issues

Security issues and bugs should be reported privately, via email, to the Microsoft Security Response Center (MSRC) at secure@microsoft.com. You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message. Further information, including the [MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155) key, can be found in the [Security TechCenter](https://technet.microsoft.com/en-us/security/default).

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under a special [Microsoft](../../LICENSE) License.
