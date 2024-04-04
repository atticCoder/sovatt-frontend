import { Authenticator, Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import ChatScreen from './screens/chatScreen';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        return (
          <div>
            <ChatScreen userId={user.userId}/>
          </div>
        )
      }}
    </Authenticator>
  );
}

export default App;