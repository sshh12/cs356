import "./App.css";
import { Box, Heading, Text } from "rebass";
import { ThemeProvider } from "theme-ui";
import theme from "@rebass/preset";
import Tasks from "./Tasks";

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            p: 4,
            color: "text",
            bg: "background",
            fontFamily: "body",
            fontWeight: "body",
            lineHeight: "body",
          }}
        >
          <Heading variant="display">Networking Calculator</Heading>
          <Text mb={4}>CS 356: Computer Networks (Spring 2021)</Text>
        </Box>
        <Box>{Tasks}</Box>
      </ThemeProvider>
    </div>
  );
}

export default App;
