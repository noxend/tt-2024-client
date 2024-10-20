import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import App from "./App.tsx";
import "./index.css";
import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client";
import { AuthProvider } from "./AuthContext.tsx";
import { setContext } from "@apollo/client/link/context";

const authLink = setContext((_, { headers }) => {
  const userId = localStorage.getItem("userId");

  return {
    headers: {
      ...headers,
      "x-user-id": userId,
    },
  };
});

const httpLink = createHttpLink({
  uri: "http://localhost:4000/gql",
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextUIProvider>
      <ApolloProvider client={client}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ApolloProvider>
    </NextUIProvider>
  </StrictMode>
);
