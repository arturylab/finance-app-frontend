'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

import {
    Box,
    Flex,
    Heading,
    Image,
    Button,
    Field,
    Fieldset,
    Input,
    Stack,
    Text,
    Link,
} from "@chakra-ui/react"

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.password.trim()) {
    setError('All fields are required');
      return;
    }

    try {
      await login(formData);
    } catch (err) {
    setError(err instanceof Error ? err.message : 'Error logging in');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError('');
  };

  if (user) return null;

  return (
    <Box 
        as={"form"}
        onSubmit={handleSubmit}
        w={{ base: "95%", md: "75%" }} 
        mx="auto" px={{ base: 4, md: 0 }}>
      <Flex direction="column" minH="100vh" align="center" justify="center">
        <Heading size="4xl" display="flex" alignItems="center" mb={10}>
          <Image src="/logo.png" alt="finance app logo" boxSize="48px" mr="2" />
          Finance App
        </Heading>
          <Fieldset.Root size="lg" maxW="sm">
            <Stack textAlign="center">
              <Fieldset.Legend>Login to your account</Fieldset.Legend>
              <Fieldset.HelperText>
                Enter your below username to login to your account
              </Fieldset.HelperText>
            </Stack>

            <Fieldset.Content>
              <Field.Root>
                <Field.Label>Username</Field.Label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </Field.Root>

              <Field.Root>
                <Flex justify="space-between" align="center" w="100%">
                  <Field.Label>Password</Field.Label>
                  <Link fontSize="sm" href="#" color="gray.700">
                    Forgot your password?
                  </Link>
                </Flex>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Field.Root>

              {error && <Text color="fg.error" textAlign="center" fontSize="sm">{error}</Text>}

            </Fieldset.Content>

            <Button type="submit" mt={4}>Login</Button>

            <Text textAlign="center" fontSize="sm" mt={4}>
              {'Don\'t have an account? '}
              <Link variant="underline" href="/register">
                Sign up
              </Link>
            </Text>
          </Fieldset.Root>
          <Footer />
      </Flex>
    </Box>

  );
};

export default Login;
