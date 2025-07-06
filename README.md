# BAYANAT - Neural Data Forge

> Advanced synthetic data generation on the blockchain

Bayanat is a cutting-edge platform that combines AI-powered synthetic data generation with blockchain technology, enabling users to create, mint, and trade high-quality synthetic datasets on the Filecoin Calibration network.

## 🚀 Features

### 🤖 AI-Powered Data Generation
- **Hugging Face Integration**: Browse and select from thousands of datasets on Hugging Face
- **Multiple AI Models**: Support for various language models including GPT-4, Llama, Mistral, and Qwen
- **Structured & Unstructured Output**: Generate both free-form text and structured JSON data
- **Prompt Engineering Wizard**: AI-assisted prompt generation for optimal results
- **Real-time Preview**: Test your prompts on sample data before full generation

### 🔗 Blockchain Integration
- **Dataset Minting**: Mint datasets as NFTs on the Filecoin Calibration network
- **On-chain Marketplace**: Buy, sell, and trade synthetic datasets
- **Decentralized Storage**: Secure dataset storage using IPFS 
- **Smart Contract Integration**: Automated pricing, access control, and revenue distribution

### 🔐 Advanced Security & Privacy
- **Lit Protocol Encryption**: End-to-end encryption for dataset content
- **Access Control**: Granular permissions for dataset access
- **Wallet Integration**: Secure authentication via RainbowKit
- **Signature Verification**: Ed25519 signature verification for data integrity

### 💰 Economic Features
- **Dynamic Pricing**: Set custom prices for your datasets in USDC
- **Revenue Sharing**: Automatic distribution of sales revenue
- **Test Token Minting**: Built-in test USDC faucet for development
- **Gas Optimization**: Efficient smart contract interactions

### 🎨 User Experience
- **Cyberpunk UI**: Futuristic, neon-themed interface with animations
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Updates**: Live progress tracking during generation
- **Template System**: Pre-built templates for common use cases

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **Blockchain**: Wagmi, Viem, RainbowKit
- **AI Integration**: Vercel AI SDK, OpenAI, Google AI
- **Storage**: IPFS (Pinata)
- **Encryption**: Lit Protocol
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- A **Filecoin Calibration** testnet wallet
- API keys for external services (see Environment Variables section)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/malawadd/byanat.git
cd bayanat-neural-forge
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Required: WalletConnect Project ID for wallet integration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Required: Pinata JWT for IPFS storage
PINATA_JWT=your_pinata_jwt_token

# Required: OpenAI API key 
OPENAI_API_KEY=your_openai_api_key

# Required: OpenAI API key 
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

```

#### How to Get API Keys:

**WalletConnect Project ID:**
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID

**Pinata JWT:**
1. Sign up at [Pinata](https://pinata.cloud/)
2. Go to API Keys section
3. Create a new JWT token with appropriate permissions


### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── create/            # Dataset creation flow
│   ├── dataset/[id]/      # Individual dataset pages
│   └── user/[id]/         # User profile pages
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── create/           # Dataset creation components
│   └── dataset/          # Dataset display components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
└── utils/                # Helper utilities
```

### Key Components

- **DatasetForm**: Multi-step form for dataset creation
- **DatasetViewer**: Display and interact with dataset content
- **WalletIntegration**: Blockchain wallet connectivity
- **EncryptionManager**: Handle Lit Protocol encryption/decryption

### Smart Contracts

The project interacts with several smart contracts on Filecoin Calibration:

- **Dataset Marketplace**: `0x94bbeB401C17FB70C704E28920501752B78dc659`
- **Mock USDC Token**: `0xB11011307e0F3c805387c10aa69F874244b1bec3`

## 🧪 Testing

### Test Token Faucet

The application includes a built-in test USDC faucet. When connected to the Filecoin Calibration network:

1. Connect your wallet
2. Navigate to any dataset page
3. Click "Mint Test Tokens" if your balance is low
4. Receive 1000 test USDC tokens instantly

### Running Tests

```bash
npm run test
# or
yarn test
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
# or
yarn build
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment:

- Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to your production WalletConnect project
- Configure `PINATA_JWT` with production Pinata credentials
- Set `OPENAI_API_KEY` for AI model access
- Set `GOOGLE_GENERATIVE_AI_API_KEY` for AI model access


## 🔮 Roadmap

- [ ] Support for decentralized ai providers
- [ ] Enhanced AI model selection
- [ ] Advanced dataset analytics
- [ ] Collaborative dataset creation
- [ ] API access for developers


---

**Built with ❤️ for the future of synthetic data**