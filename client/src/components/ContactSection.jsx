export default function ContactSection() {
  return (
    <section
      id="contact"
      className="py-16 bg-gradient-to-b from-white to-[#f0f7f4] text-[#0b1e40] border-t border-[#a9bb9d]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-center mb-8">
          Contact Us
        </h2>
        <p className="text-center text-lg text-gray-600 mb-12">
          Have questions or need assistance? Reach out to us below.
        </p>
        <form className="max-w-xl mx-auto">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 px-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 px-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              required
              className="mt-1 px-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-[#a9bb9d] text-white font-semibold py-2.5 rounded-lg shadow-md hover:bg-[#8fa88a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a9bb9d] transition-all duration-300"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
}

