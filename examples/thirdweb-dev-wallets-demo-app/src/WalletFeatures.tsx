import {
  Button,
  Card,
  CardBody,
  Code,
  Divider,
  Heading,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { InitializedUser } from "@thirdweb-dev/wallets";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";

interface Props {
  user: InitializedUser | undefined;
}

enum Features {
  GET_WALLET = "GET_WALLET",
  SIGN_MESSAGE = "SIGN_MESSAGE",
  SIGN_TYPED_DATA = "SIGN_TYPED_DATA",
  SIGN_T_ETH = "SIGN_T_ETH",
  SIGN_T_GOERLI = "SIGN_T_GOERLI",
  CALL_GASLESS_CONTRACT = "CALL_GASLESS_CONTRACT",
  SEND_NATIVE_TOKEN = "SEND_NATIVE_TOKEN",
  FETCH_BALANCE = "FETCH_BALANCE",
}

const PLACEHOLDER = "The result will appear here";

export const WalletFeatures: React.FC<Props> = ({ user }) => {
  const [loading, setLoading] = useState<Features | null>(null);
  const [result, setResult] = useState<any>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const wallet = user?.wallet;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const onResult = (result: any) => {
    setResult((prevState: any) => ({
      ...(prevState || {}),
      ...result,
    }));
  };
  const getAddress = async () => {
    setLoading(Features.GET_WALLET);
    const signer = await wallet?.getEthersJsSigner();
    const address = await signer?.getAddress();
    setLoading(null);
    onResult({
      wallet: address,
    });
    console.log("address", address);
  };

  const fetchBalance = useCallback(async () => {
    setLoading(Features.FETCH_BALANCE);
    try {
      const signer = await wallet?.getEthersJsSigner();

      if (!signer) {
        throw new Error("Wallet not connected");
      }

      const balanceWei = await signer.getBalance();

      // Let's add some debugging here:
      console.log("Fetched balance in Wei:", balanceWei.toString());

      const balanceEth = ethers.utils.formatEther(balanceWei);
      console.log("Converted balance in ETH:", balanceEth);

      setBalance(balanceEth);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching balance:", error.message);
      } else {
        console.error("An unknown error occurred while fetching balance");
      }
    } finally {
      setLoading(null);
    }
  }, [wallet]);

  useEffect(() => {
    if (user?.wallet) {
      fetchBalance();
    }
  }, [fetchBalance, user?.wallet]);

  const signMessage = async () => {
    setLoading(Features.SIGN_MESSAGE);
    // You can override the RPC url to whatever endpoint you need
    const signer = await wallet?.getEthersJsSigner();
    console.log("await signer?.getChainId()", await signer?.getChainId());
    const signedMessage = await signer?.signMessage("hello world");
    onResult({
      signedMessage,
    });
    setLoading(null);
    console.log("signedMessage", signedMessage);
  };

  const dataToSign = {
    domain: {
      version: "1.0.0",
      name: "thirdweb Embedded wallet services",
      chainId: 80001,
    },
    types: {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    },
    message: {
      from: {
        name: "catty.thirdweb.eth",
        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
      },
      to: {
        name: "jason.thirdweb.eth",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
      contents: "Jason! Did you see thirdweb's new embedded wallets!",
    },
  };

  const renderTypedDataDisplay = (data: typeof dataToSign) => {
    return (
      <Stack spacing={3}>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Domain:</strong>
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Version:</strong> {data.domain.version}
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Name:</strong> {data.domain.name}
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Chain Id:</strong> {data.domain.chainId}
        </Text>
        <Divider />
        <Text mt={2} fontSize="lg" color="black">
          <strong>Types:</strong>
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Person:</strong> Name (String), Wallet (Address)
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Mail:</strong> From (Person), To (Person), Contents (String)
        </Text>
        <Divider />
        <Text mt={2} fontSize="lg" color="black">
          <strong>Message:</strong>
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>From:</strong> {data.message.from.name}
        </Text>
        <Text mt={2} fontSize="sm" color="black">
          {data.message.from.wallet}
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>To:</strong> {data.message.to.name}
        </Text>
        <Text mt={2} fontSize="sm" color="black">
          {data.message.to.wallet}
        </Text>
        <Text mt={2} fontSize="lg" color="black">
          <strong>Contents:</strong> {data.message.contents}
        </Text>
      </Stack>
    );
  };

  const signTypedDataV4 = async () => {
    setLoading(Features.SIGN_TYPED_DATA);

    const signer = await wallet?.getEthersJsSigner();

    const signedTypedData = await signer?._signTypedData(
      dataToSign.domain,
      dataToSign.types,
      dataToSign.message,
    );
    setLoading(null);
    onResult({
      signedTypedData,
    });
  };

  const sendNativeToken = async () => {
    setLoading(Features.SEND_NATIVE_TOKEN);
    try {
      const signer = await wallet?.getEthersJsSigner();
      if (!signer) {
        throw new Error("Wallet not connected");
      }

      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.utils.parseEther(amount),
      });

      setTxStatus(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      setTxStatus(`Transaction ${tx.hash} has been confirmed`);
    } catch (error) {
      if (typeof error === "string") {
        console.error("Error sending native token:", error);
        setTxStatus(`Error: ${error}`);
      } else if (error instanceof Error) {
        console.error("Error sending native token:", error.message);
        setTxStatus(`Error: ${error.message}`);
      } else {
        console.error("An unknown error occurred while sending native token");
        setTxStatus(`An unknown error occurred`);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card bg="white" borderRadius={8}>
      <CardBody>
        <Heading size="md">Wallet Features</Heading>
        <Divider my={4} />
        <Stack spacing={6}>
          <Section title="Native Token Balance">
            <Button
              onClick={fetchBalance}
              colorScheme="purple"
              isLoading={loading === Features.FETCH_BALANCE}
            >
              Fetch Balance
            </Button>
            <Text fontSize="xl" color="black">
              {balance ? `${balance} MATIC` : "Balance not fetched"}
            </Text>
          </Section>

          <Section title="Wallet Address">
            <Stack>
              <Button
                onClick={getAddress}
                colorScheme="purple"
                isLoading={loading === Features.GET_WALLET}
              >
                Get Wallet Address
              </Button>
              <Code borderRadius={8} p={4}>
                {result?.wallet ? (
                  <Link
                    isExternal
                    textDecoration="underline"
                    href={`https://mumbai.polygonscan.com/address/${result.wallet}`}
                  >
                    {result.wallet}
                  </Link>
                ) : (
                  <Text color="gray.500" fontStyle="italic" size="sm">
                    {PLACEHOLDER}
                  </Text>
                )}
              </Code>
            </Stack>
          </Section>

          <Section title="Transfer Native Token">
            <Stack>
              <Input
                color="black"
                placeholder="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <Input
                mt={2}
                color="black"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button
                mt={2}
                onClick={sendNativeToken}
                colorScheme="purple"
                isLoading={loading === Features.SEND_NATIVE_TOKEN}
              >
                Send
              </Button>
              <Text mt={2} fontSize="md" color="black">
                {txStatus}
              </Text>
            </Stack>
          </Section>

          <Section title="Sign Message">
            <Stack>
              <Button
                onClick={signMessage}
                colorScheme="purple"
                isLoading={loading === Features.SIGN_MESSAGE}
              >
                Sign Message
              </Button>
              <Code
                borderRadius={8}
                p={4}
                width="full"
                data-testid="signed-message"
              >
                {result?.signedMessage || (
                  <Text color="black" fontStyle="italic" size="sm">
                    {PLACEHOLDER}
                  </Text>
                )}
              </Code>
            </Stack>
          </Section>

          <Section title="Sign Typed Data (EIP712)">
            {renderTypedDataDisplay(dataToSign)}
            <Stack>
              <Button
                onClick={signTypedDataV4}
                colorScheme="purple"
                isLoading={loading === Features.SIGN_TYPED_DATA}
              >
                Sign Type Data (EIP712)
              </Button>
              <Text mt={2} fontSize="md" color="black">
                Signed Result:
              </Text>
              <Code
                borderRadius={8}
                p={4}
                width="full"
                data-testid="signed-typed-data"
              >
                {result?.signedTypedData || (
                  <Text color="black" fontStyle="italic" size="sm">
                    {PLACEHOLDER}
                  </Text>
                )}
              </Code>
            </Stack>
          </Section>

          <Section title="Export Private Key">
            <Stack>
              <Button
                data-testid="export-private-key-button"
                onClick={onOpen}
                colorScheme="purple"
                mt={4}
              >
                Export Account
              </Button>
              <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Export Account</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <iframe
                      title="export private key"
                      src={`${
                        window.localStorage.getItem("THIRDWEB_DEV_URL") ??
                        "https://embedded-wallet.thirdweb.com"
                      }/sdk/2022-08-12/embedded-wallet/export?clientId=${
                        process.env.REACT_APP_THIRDWEB_CLIENT_ID
                      }`}
                      width="525px"
                      height="475px"
                    />
                  </ModalBody>
                </ModalContent>
              </Modal>
            </Stack>
          </Section>
        </Stack>
      </CardBody>
    </Card>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Stack
    spacing={4}
    borderWidth="1px"
    borderRadius="8px"
    p={4}
    borderColor="gray.300"
  >
    <Heading size="md" color="black">
      {title}
    </Heading>
    <Divider borderColor="gray.300" />
    {children}
  </Stack>
);
