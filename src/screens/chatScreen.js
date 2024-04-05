import React, { useState, useEffect } from 'react';
import './chatScreen.css';
import { Button } from '@aws-amplify/ui-react';
import { get } from 'aws-amplify/api';
import {signOut} from 'aws-amplify/auth';
import { uploadData, downloadData } from 'aws-amplify/storage';

function Sidebar({ isOpen }) {
    const handleSignOut = async () => {
        try {
        await signOut();
        window.location.reload(); // or use a more sophisticated method of redirecting or updating state
        } catch (error) {
        console.error('Error signing out: ', error);
        }
    };

    return (
        <div className={`sidebar ${isOpen ? 'active' : ''}`}>
          {/* Other menu items can be added here */}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
    );
}

function ChatMessages({ messages }) {
    return (
      <div className="chat__messages">
        {messages.map((message, index) => (
          <div key={index} className={`chat__message ${message.sender === 'assistant' ? 'chat__receiver' : ''}`}>
            <span className="chat__text">{message.text}</span>
            {message.time && !message.isTyping && ( // Only display time if it's available and not a typing message
              <span className="chat__timestamp">{message.time}</span>
            )}
          </div>
        ))}
      </div>
    );
}

function ChatInput({ input, setInput, sendMessage, isLoading }) {
    return (
      <div className="chat__footer">
        <form onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            type="text"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>Send</button>
        </form>
      </div>
    );
}

function ChatScreen({userId}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // const [lastStoredMessageIndex, setLastStoredMessageIndex] = useState(-1);

    const storeMessages = async (messagesToStore) => {
      try {
        const messagesJson = JSON.stringify(messagesToStore);
        const result = await uploadData({
          key: 'full-conversation/'+userId+'.json',
          data: messagesJson
        }).result;
        // setLastStoredMessageIndex(lastStoredMessageIndex+2)
      } catch (error) {
        console.log('Error : ', error);
      }
    };

    const fetchChatHistory = async () => {
      try {
        const key = 'full-conversation/' + userId + '.json';
        const fetchResult = await downloadData({ key });
        const fileContent = await fetchResult.result;

        if (fileContent) {
          const text = await fileContent.body.text();
          console.log('Fetched chat history:', fileContent);
          const messages = JSON.parse(text); 
          setMessages(messages); 
          // setLastStoredMessageIndex(messages.length - 1)
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        const firstDefaultMessage = {
          sender: 'assistant',
          text: `Hi! I'm Leo, you can think of me as your wise friend who is pretty good at human behavior and psychology. Want my opinion on an argument you had? Want to share something that's troubling you? Or need a therapy? Talk to me :) \n All our conversations are completely private, so don't hold back.`,
          time: getTime()
        }
        setMessages([firstDefaultMessage])
        
        // Handle errors or cases where the file doesn't exist
      }
    };

    useEffect(() => {
      fetchChatHistory();
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const getTime = () => {
        const date = new Date();
        return date.toLocaleTimeString([], {year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    };
  
    const fetchReplyFromAPI = async (transformed_messages) => {
      // try {
      //   // Example API call
      //   const operation = await get({apiName: "askkrishna", path: "/prod", options: {
      //       queryParams: {
      //         message: encodeURIComponent(JSON.stringify(transformed_messages))
      //       }
      //   }});
      
      //   const responseData = await operation.response;

      //   // Assuming the Lambda returns JSON, parse it
      //   const data = await responseData.body.json();
      //   return data.message;
      // } catch (error) {
      //   console.error('There was a problem with your fetch operation: ', error.message);
      //   return "Sorry, there is some technical problem on our end, please try again later"; // Fallback message
      // }
      return "We are down for maintainence, please check back later."; // Fallback message
    };
  
    const sendMessage = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const userMessage = input;
        const currentTime = getTime();
    
        const appended_messages = [...messages, { text: userMessage, sender: 'user', time: currentTime }]

        setMessages(appended_messages);

        const typingMessage = { text: "typing...", sender: 'assistant', isTyping: true };
        const messagesWithTyping = [...appended_messages, typingMessage];
        setMessages(messagesWithTyping);

        try {
          const replyMessage = await fetchReplyFromAPI(appended_messages.map(message => ({
            role: message.sender,
            content: message.text,
          })));

          const updatedMessages = [...appended_messages.filter(msg => !msg.isTyping), { text: replyMessage, sender: 'assistant', time: getTime() }];
          setMessages(updatedMessages);
          storeMessages(updatedMessages); 
        } catch (error) {
          console.error("Error fetching reply: ", error);
        } finally {
          setIsLoading(false);
          setInput('');
        }

    };


    return (
      <div className="chatContainer">
        <button className="burger-menu" onClick={toggleSidebar}>
            &#9776; {/* Unicode for burger icon */}
        </button>
        <Sidebar isOpen={sidebarOpen} />
        <div className="app__body">
            <ChatMessages messages={messages} />
            <ChatInput input={input} setInput={setInput} isLoading={isLoading} sendMessage={(e) => sendMessage(e)} />
        </div>
      </div>
    );
  }

export default ChatScreen;
