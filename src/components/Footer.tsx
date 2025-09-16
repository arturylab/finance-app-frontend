// components/Footer.tsx
import { Box, Text } from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box
      as="footer"
      py={6}
      px={6}
    >
      <Text
        fontSize="sm"
        color="gray.600"
        textAlign="center"
        _dark={{
          color: 'gray.400',
        }}
      >
        © 2025 arturylab. All rights reserved.
      </Text>
    </Box>
  );
};

export default Footer;