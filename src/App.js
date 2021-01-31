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
          <Heading variant="display">CS356 Calculator</Heading>
          <Text mb={4}>Math is hard.</Text>
        </Box>
        <Box>{Tasks}</Box>
      </ThemeProvider>
    </div>
  );
}

export default App;
