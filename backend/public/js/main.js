(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();


    // Initiate the wowjs
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').css('top', '0px');
        } else {
            $('.sticky-top').css('top', '-100px');
        }
    });


    // Dropdown on mouse hover
    const $dropdown = $(".dropdown");
    const $dropdownToggle = $(".dropdown-toggle");
    const $dropdownMenu = $(".dropdown-menu");
    const showClass = "show";

    $(window).on("load resize", function () {
        if (this.matchMedia("(min-width: 992px)").matches) {
            $dropdown.hover(
                function () {
                    const $this = $(this);
                    $this.addClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "true");
                    $this.find($dropdownMenu).addClass(showClass);
                },
                function () {
                    const $this = $(this);
                    $this.removeClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "false");
                    $this.find($dropdownMenu).removeClass(showClass);
                }
            );
        } else {
            $dropdown.off("mouseenter mouseleave");
        }
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });


    // Header carousel
    $(".header-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        items: 1,
        dots: false,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        margin: 24,
        dots: true,
        loop: true,
        nav: false,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });

})(jQuery);

// Profile Dropdown Logic
document.addEventListener('DOMContentLoaded', function () {
  const profileDropdownMenu = document.getElementById('profileDropdownMenu');
  const profileDropdownBtn = document.getElementById('profileDropdown');
  if (!profileDropdownMenu || !profileDropdownBtn) return;

  // Helper to render dropdown
  function renderDropdown(user) {
    if (!user) {
      profileDropdownMenu.innerHTML = `
        <a class="dropdown-item" href="login.html">Login</a>
        <a class="dropdown-item" href="signup.html">Signup</a>
      `;
    } else {
      profileDropdownMenu.innerHTML = `
        <span class="dropdown-item-text d-block px-3 py-2"><strong>${user.name}</strong><br><small>${user.email}</small></span>
        <hr class="dropdown-divider">
        <a class="dropdown-item" href="profile.html">Profile</a>
        <a class="dropdown-item" href="#" id="settingsLink">Settings</a>
        <a class="dropdown-item" href="#" id="logoutLink">Logout</a>
      `;
    }
    profileDropdownMenu.classList.add('show'); // Ensure dropdown is visible when toggled
  }

  // Check login state
  let dropdownRendered = false;
  function alwaysShowDropdown() {
    if (!dropdownRendered) {
      renderDropdown(null);
      dropdownRendered = true;
    }
  }

  fetch('/api/profile', { credentials: 'include' })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      renderDropdown(data && data.user ? data.user : null);
      dropdownRendered = true;
      // Add logout/settings handlers if logged in
      if (data && data.user) {
        setTimeout(() => {
          const logoutLink = document.getElementById('logoutLink');
          if (logoutLink) {
            logoutLink.addEventListener('click', function (e) {
              e.preventDefault();
              fetch('/api/logout', { method: 'POST', credentials: 'include' })
                .then(() => window.location.reload());
            });
          }
          const settingsLink = document.getElementById('settingsLink');
          if (settingsLink) {
            settingsLink.addEventListener('click', function (e) {
              e.preventDefault();
              window.location.href = 'profile.html#settings';
            });
          }
        }, 100);
      }
    })
    .catch(() => alwaysShowDropdown());

  // Fallback: always show dropdown if fetch never returns
  setTimeout(alwaysShowDropdown, 2000);

  // No custom dropdown toggle: rely on Bootstrap's built-in dropdown
});





