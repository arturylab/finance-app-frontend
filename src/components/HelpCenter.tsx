'use client';

import React from 'react';
import {
  Accordion,
  Box,
  Container,
  Heading,
  Stack,
  Text,
  Badge,
  Button,
  HStack,
  Icon,
} from '@chakra-ui/react';
import {
  LuCreditCard,
  LuPiggyBank,
  LuTrendingUp,
  LuShield,
  LuLifeBuoy,
  LuMail,
} from 'react-icons/lu';

interface FAQItem {
  value: string;
  question: string;
  answer: string | React.ReactNode;
  category: 'accounts' | 'transactions' | 'security' | 'general';
}

const HelpCenter: React.FC = () => {
  const faqItems: FAQItem[] = [
    {
      value: 'create-account',
      category: 'accounts',
      question: 'How do I create a new account?',
      answer: (
        <Stack gap="2">
          <Text>To create a new account, follow these steps:</Text>
          <Text>{`1. Go to the "Accounts" section in the main menu`}</Text>
          <Text>{`2. Click the "New Account" button`}</Text>
          <Text>3. Enter the account name and initial balance</Text>
          <Text>4. Save the information</Text>
        </Stack>
      )
    },
    {
      value: 'edit-account',
      category: 'accounts',
      question: 'Can I edit or delete an existing account?',
      answer: 'Yes, you can edit the name and balance of any account from the accounts list. To delete an account, use the delete option, but keep in mind that all associated transactions will also be deleted.'
    },
    {
      value: 'add-transaction',
      category: 'transactions',
      question: 'How do I record a new transaction?',
      answer: (
        <Stack gap="2">
          <Text>To record a transaction:</Text>
          <Text>{`1. Go to the "Transactions" section`}</Text>
          <Text>{`2. Click "New Transaction"`}</Text>
          <Text>3. Select the account, category, and amount</Text>
          <Text>4. Add an optional description</Text>
          <Text>5. Confirm the transaction</Text>
        </Stack>
      )
    },
    {
      value: 'categories',
      category: 'transactions',
      question: 'How do transaction categories work?',
      answer: 'Categories help you organize your transactions into income and expenses. You can create custom categories like "Food", "Transportation", "Salary", etc. This will help you have better control and analysis of your finances.'
    },
    {
      value: 'transfers',
      category: 'transactions',
      question: 'Can I transfer money between my accounts?',
      answer: 'Yes, you can make transfers between your accounts using the transfer function. This will automatically update the balance of both accounts without duplicating transactions.'
    },
    {
      value: 'data-security',
      category: 'security',
      question: 'How secure is my financial information?',
      answer: (
        <Stack gap="2">
          <Text>Your security is our priority:</Text>
          <Text>• We use JWT authentication to protect your session</Text>
          <Text>• All communications are encrypted</Text>
          <Text>• Only you have access to your personal information</Text>
          <Text>{`• We don't share data with third parties`}</Text>
        </Stack>
      )
    },
    {
      value: 'password-reset',
      category: 'security',
      question: 'How can I change my password?',
      answer: 'The password change feature is currently in development. If you need to change your password, contact technical support through the channels available on this page.'
    },
    {
      value: 'export-data',
      category: 'general',
      question: 'Can I export my data?',
      answer: 'The data export feature is in development. Soon you will be able to export your transactions and reports in CSV and PDF formats.'
    },
    {
      value: 'mobile-app',
      category: 'general',
      question: 'Is there a mobile app available?',
      answer: 'Currently we only have the web version, but it is optimized for mobile devices. A native application is on our roadmap for future versions.'
    },
    {
      value: 'backup',
      category: 'general',
      question: 'How is my data backed up?',
      answer: 'Your data is automatically backed up on our secure servers. We use multiple backup layers to ensure your information is always available and protected.'
    }
  ];

  const getCategoryIcon = (category: FAQItem['category']) => {
    switch (category) {
      case 'accounts':
        return <LuPiggyBank />;
      case 'transactions':
        return <LuCreditCard />;
      case 'security':
        return <LuShield />;
      default:
        return <LuLifeBuoy />;
    }
  };

  const getCategoryColor = (category: FAQItem['category']) => {
    switch (category) {
      case 'accounts':
        return 'green';
      case 'transactions':
        return 'blue';
      case 'security':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCategoryLabel = (category: FAQItem['category']) => {
    switch (category) {
      case 'accounts':
        return 'Accounts';
      case 'transactions':
        return 'Transactions';
      case 'security':
        return 'Security';
      default:
        return 'General';
    }
  };

  return (
    <Container maxW="4xl" py="8">
      <Stack gap="8">
        {/* Header */}
        <Stack gap="4" textAlign="center">
          <Heading>
            Help Center
          </Heading>
          <Text fontSize="md" color="fg.muted">
            Find answers to the most frequently asked questions about your personal finance app
          </Text>
        </Stack>

        {/* Quick Stats */}
        <HStack justify="center" flexWrap="wrap" gap="4">
          <Badge size="md" variant="subtle" colorPalette="blue">
            <Icon>
              <LuTrendingUp />
            </Icon>
            Financial Control
          </Badge>
          <Badge size="md" variant="subtle" colorPalette="green">
            <Icon>
              <LuPiggyBank />
            </Icon>
            Account Management
          </Badge>
          <Badge size="md" variant="subtle" colorPalette="purple">
            <Icon>
              <LuShield />
            </Icon>
            Secure Data
          </Badge>
        </HStack>

        {/* FAQ Section */}
        <Stack gap="6">
          <Heading size="md">Frequently Asked Questions</Heading>
          <Accordion.Root variant="enclosed" multiple>
            {faqItems.map((item) => (
              <Accordion.Item key={item.value} value={item.value}>
                <Accordion.ItemTrigger>
                  <HStack flex="1" gap="3">
                    <Icon color={`${getCategoryColor(item.category)}.fg`}>
                      {getCategoryIcon(item.category)}
                    </Icon>
                    <Stack gap="1" textAlign="left" flex="1">
                      <Text fontWeight="medium">{item.question}</Text>
                      <Badge
                        size="sm"
                        variant="subtle"
                        colorPalette={getCategoryColor(item.category)}
                        alignSelf="flex-start"
                      >
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </Stack>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
                    <Box pl="10">
                      {typeof item.answer === 'string' ? (
                        <Text>{item.answer}</Text>
                      ) : (
                        item.answer
                      )}
                    </Box>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Stack>

        {/* Contact Section */}
        <Box
          bg="bg.subtle"
          p="6"
          borderRadius="lg"
          borderWidth="1px"
        >
          <Stack gap="6">
            <Stack gap="2" textAlign="center">
              <Heading size="md">Need more help?</Heading>
              <Text color="fg.muted">
                {`If you didn't find the answer you're looking for, don't hesitate to contact us`}
              </Text>
            </Stack>

            <Stack gap="4">
              <HStack justify="center" flexWrap="wrap" gap="4">
                <Button bg="#4DE3AF" size="sm">
                  <Icon>
                    <LuMail />
                  </Icon >
                  arturylab@gmail.com
                </Button>
              </HStack>

            </Stack>
          </Stack>
        </Box>

        {/* Tips Section */}
        <Box
          bg="#4DE3AF"
          p="6"
          borderRadius="lg"
        >
          <Stack gap="4">
            <HStack>
              <Icon fontSize="xl" color={"gray.800"}>
                <LuLifeBuoy />
              </Icon>
              <Heading size="md" color={"gray.800"}>Pro Tip</Heading>
            </HStack>
            <Text color={"gray.800"}>
              To get the most out of your finance app, we recommend:
              reviewing your transactions weekly, categorizing all your expenses and income,
              and setting monthly savings goals. This will help you maintain better
              control of your personal finances!
            </Text>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default HelpCenter;