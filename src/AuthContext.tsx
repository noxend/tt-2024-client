import { createContext, PropsWithChildren, FC } from "react";
import { graphql } from "./gql";
import { useMutation, useSuspenseQuery } from "@apollo/client";
import { useForm } from "react-hook-form";
import { Input, Button } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";

export const AuthContext = createContext({});

const LOGIN = graphql(`
  mutation Login($username: String!) {
    login(username: $username) {
      id
      username
    }
  }
`);

const ME = graphql(`
  query Me {
    me {
      id
      username
    }
  }
`);

const LoginForm = () => {
  const { register, handleSubmit } = useForm({
    defaultValues: { username: "" },
  });

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      localStorage.setItem("userId", login.id);
    },
    update: (cache, { data }) => {
      cache.writeQuery({ query: ME, data: { me: data!.login } });
    },
  });

  const onSubmit = (data: { username: string }) => {
    login({ variables: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input placeholder="Username" {...register("username")} />
      <Button type="submit" color="primary" fullWidth isLoading={loading}>
        Login
      </Button>
    </form>
  );
};

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data } = useSuspenseQuery(ME);

  return (
    <AuthContext.Provider value={data.me}>
      <AnimatePresence mode="wait">
        {data.me ? (
          <motion.div
            key="children"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: 50,
            }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: -50,
            }}
          >
            <LoginForm />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};
