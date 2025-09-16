'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PasswordInput } from "@/components/ui/password-input"
import Footer from '@/components/Footer';

import {
    Box,
    Flex,
    Button,
    Field,
    Fieldset,
    Input,
    Stack,
    Text,
    Link,
} from "@chakra-ui/react"

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const { register, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
        router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
        await register(formData);
        } catch (err) {
        setError(err instanceof Error ? err.message : 'Error registering');
        }
    };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (user) {
    return null;
  }

  return (
    <Box 
        as={"form"}
        onSubmit={handleSubmit}
        w={{ base: "95%", md: "75%" }} 
        mx="auto" px={{ base: 4, md: 0 }}>
      <Flex direction="column" minH="100vh" align="center" justify="center">
          <Fieldset.Root size="lg" maxW="sm">
            <Stack textAlign="center">
              <Fieldset.Legend fontSize="4xl" mb={4}>Create an account</Fieldset.Legend>
              <Fieldset.HelperText>
                Enter your username and email below to create your account
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
                <Field.Label>Email address</Field.Label>
                <Input name="email" type="email" placeholder="me@example.com" value={formData.email} onChange={handleChange} />
              </Field.Root>

            <Field.Root>
                <Field.Label>Password</Field.Label>
                <PasswordInput name='password' value={formData.password} onChange={handleChange} />
            </Field.Root>

              {error && <Text color="fg.error" textAlign="center" fontSize="sm">{error}</Text>}

            </Fieldset.Content>

            <Button type="submit" mt={4}>Create account</Button>

            <Text textAlign="center" fontSize="sm" mt={4}>
              {'Already have an account? '}
              <Link variant="underline" href="/login">
                Sign in
              </Link>
            </Text>
          </Fieldset.Root>
          <Footer />
      </Flex>
    </Box>
  );
}

export default Register;