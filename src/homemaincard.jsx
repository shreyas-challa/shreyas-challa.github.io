import { RippleButton } from './components/ui/ripple-button';
import { useNavigate } from 'react-router-dom';

// prefuckup ripple color #ADD8E6

function HomeMainCard() {
  const navigate = useNavigate();
  const onReadMore = () => navigate(`/blog`);

  return (
    <div className='rounded-2xl w-[600px] h-[500px] items-between flex flex-col p-8'>
      <div className='p-2'>
        <p>There was a problem with the server. Once AWS went down, we had to quickly migrate to a new provider. AWS in general is a great service, but sometimes it's not available.</p>
      </div>
      <div className='p-2'    >
        <p>The server was administered by Tyler Durden. Tyler has been with us for a long time. He is a great asset to the team and sometimes tries to act in different ways which can be difficult to manage.</p>
      </div>
      <div className='p-2'>
        <p>That is when we approached Tyler for a cute little testimonial. Instead of a testimonial, he started yapping about project mayhem and how we should be using our skills to build a better future.</p>
      </div>
      <div className='p-2'>
        <p>That is when we approached Tyler for a cute little testimonial. Instead of a testimonial, he started yapping about project mayhem and how we should be using our skills to build a better future.</p>
      </div>
      
      <div className='ml-2 mt-auto'>
        <RippleButton duration={600} rippleColor="#ADD8E6">Read more!</RippleButton>
      </div>
    </div>
  )
}


export default HomeMainCard;