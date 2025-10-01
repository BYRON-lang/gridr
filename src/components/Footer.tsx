import { component$ } from '@builder.io/qwik';

export const Footer = component$(() => {
  return (
    <footer class="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 py-8">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <p>© {new Date().getFullYear()} Gridrr. All rights reserved.</p>
          </div>
          <div class="flex space-x-6">
            {/* Footer links will go here */}
          </div>
        </div>
      </div>
    </footer>
  );
});
