import ReactMarkdown from "react-markdown";

export default function PostContent({ post }) {
  console.log(post.metadata.name);
  return (
    <div className="flex justify-center mt-16 bg-[#03001C]">
      <div className="p-6">
        <h5 className="text-xl text-white font-medium mb-8">
          {post.metadata.name}
        </h5>
        <span className="text-xl font-bold bg-white rounded-xl px-4 py-2">Written by {post.profile.name}</span>
        <ReactMarkdown className="markdown text-white">
          {post.metadata.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
