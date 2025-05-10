import { GWChatWidget, GWChatWidgetProps } from "gooey-web-widget";

export default function GooeyChatWidget({
  state,
  onChange,
  ...rest
}: GWChatWidgetProps & {
  state: Record<string, any>;
  onChange: (value: string) => void;
}) {

  const handleSend = (message: string) => {
    // Handle the send event here
    console.log("Message sent:", message);
    // You can also call onChange if needed
    onChange(message);
  };

  const handleClear = () => {
    // Handle the clear event here
    console.log("Chat cleared");
    // You can also call onChange if needed
    // onChange("");
  };

  return (
    <div className="h-100">
      <GWChatWidget
        {...rest}
        onSend={handleSend}
        onNewConversation={handleClear}
      />
    </div>
  );
}
