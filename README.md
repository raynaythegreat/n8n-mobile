# n8n Mobile

A mobile client for [n8n](https://n8n.io/) - the workflow automation platform. Manage your workflows, monitor executions, and control your automation from anywhere.

## Features

- **Workflow Management** - View, activate, and deactivate your n8n workflows
- **Execution Monitoring** - Track workflow executions in real-time with detailed logs
- **Execution Details** - View node-by-node execution data and error information
- **Multiple Instances** - Connect to multiple n8n instances and switch between them
- **Dark/Light Theme** - Automatic theme detection with manual toggle
- **Secure Storage** - API credentials stored securely on device

## Screenshots

| Workflows | Executions | Settings |
|-----------|------------|----------|
| ![Workflows](./docs/screenshots/workflows.png) | ![Executions](./docs/screenshots/executions.png) | ![Settings](./docs/screenshots/settings.png) |

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Physical device with [Expo Go](https://expo.dev/client/) (optional)

### Install from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-mobile.git
cd n8n-mobile

# Install dependencies
npm install

# Start the development server
npm start
```

### Run on Device/Emulator

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web
```

## Configuration

### Getting Your n8n API Key

1. Open your n8n instance in a web browser
2. Go to **Settings** → **API** → **Create API Key**
3. Enter a label for your API key (e.g., "Mobile App")
4. Copy the generated API key immediately (it won't be shown again)

### Connecting to n8n

1. Open the app and navigate to **Connection** screen
2. Enter your n8n instance URL (e.g., `https://your-instance.n8n.cloud` or `http://192.168.1.100:5678`)
3. Paste your API key
4. Tap **Connect** to test the connection

> **Note:** For self-hosted instances, ensure your mobile device can reach the n8n server (same network or VPN).

## Usage

### Workflows Tab

- View all workflows from your n8n instance
- Toggle workflow activation status with the switch
- Tap a workflow to view details and recent executions
- Pull to refresh the workflow list

### Executions Tab

- View recent workflow executions across all workflows
- Filter by execution status (success, error, running)
- Tap an execution to view detailed node execution data
- See execution duration and timestamp

### Settings

- Switch between connected n8n instances
- Toggle dark/light theme
- View app version and n8n instance info
- Clear cached data

## Development

### Project Structure

```
n8n-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Workflows screen
│   │   ├── executions.tsx # Executions screen
│   │   └── settings.tsx   # Settings screen
│   ├── workflow/[id].tsx  # Workflow detail
│   ├── execution/[id].tsx # Execution detail
│   └── connection.tsx     # Connection setup
├── src/
│   ├── api/               # n8n API client
│   ├── components/        # Reusable components
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── screens/           # Screen components
│   ├── theme/             # Theme configuration
│   └── types/             # TypeScript types
├── assets/                # Images, fonts, etc.
└── constants/             # App constants
```

### Available Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
```

### Environment Variables

Create a `.env.local` file for local development:

```env
# Optional: Default n8n instance for development
N8N_DEFAULT_URL=http://localhost:5678
N8N_DEFAULT_API_KEY=your-api-key
```

## Tech Stack

- **[React Native](https://reactnative.dev/)** - Cross-platform mobile framework
- **[Expo](https://expo.dev/)** - React Native development platform
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React Native Paper](https://callstack.github.io/react-native-paper/)** - Material Design UI components
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based navigation
- **[Axios](https://axios-http.com/)** - HTTP client

## API Reference

This app uses the official n8n Public API:

- **Documentation:** [https://docs.n8n.io/api/](https://docs.n8n.io/api/)
- **OpenAPI Spec:** [https://api.n8n.io/v1/docs](https://api.n8n.io/v1/docs)

### Supported Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /workflows` | List all workflows |
| `GET /workflows/:id` | Get workflow details |
| `PATCH /workflows/:id` | Update workflow (activate/deactivate) |
| `GET /executions` | List executions |
| `GET /executions/:id` | Get execution details |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new functionality
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [n8n](https://n8n.io/) - The workflow automation platform
- [Expo](https://expo.dev/) - For making React Native development easier
- [React Native Paper](https://callstack.github.io/react-native-paper/) - For the beautiful UI components

---

Made with ❤️ for the n8n community
