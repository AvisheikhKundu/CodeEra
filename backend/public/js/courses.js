
document.addEventListener('DOMContentLoaded', function () {
  const coursesContainer = document.querySelector('.g-4.py-2');

  // Fetch courses from the API
  fetch('/api/courses')
    .then(response => response.json())
    .then(data => {
      const courses = data.courses;
      coursesContainer.innerHTML = ''; // Clear existing courses

      courses.forEach(course => {
        const courseCard = `
          <div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
            <div class="course-item shadow">
              <div class="position-relative overflow-hidden text-light image">
                <img class="img-fluid" src="${course.image || 'img/course-1.jpg'}" alt="">
                <div style="position:absolute;top: 15px;left: 16px; font-size:12px; border-radius:3px; background-color:${course.price > 0 ? '#0ed44c' : '#2c68bc'};"
                  class="px-2 py-1 fw-bold text-uppercase">${course.price > 0 ? 'PAID' : 'FREE'}</div>
              </div>
              <div class="p-2 pb-0">
                <h5 class="mb-1"><a href="single.html?id=${course._id}" class="text-dark">${course.title}</a></h5>
              </div>
              <div class="d-flex">
                <small class="flex-fill text-center py-1 px-2"><i class="fa fa-star text-warning me-2"></i>4.55</small>
                <small class="flex-fill text-center py-1 px-2"><i class="fa fa-user-graduate me-2"></i>${course.enrolledUsers.length} Learners</small>
                <small class="flex-fill text-center py-1 px-2"><i class="fa fa-user me-2"></i>Beginner</small>
              </div>
              <div class="d-flex">
                <small class="flex-fill text-left p-2 px-2"><i class="fa fa-clock me-2"></i>${course.duration || '2.0'} Hrs</small>
                <small class="py-1 px-2 fw-bold fs-6 text-center">BDT ${course.price || 0}</small>
                <small class="text-primary py-1 px-2 fw-bold fs-6" style="float:right;">
                  <a href="#" class="enroll-btn" data-course-id="${course._id}">Enroll Now</a>
                  <i class="fa fa-chevron-right me-2 fs-10"></i>
                </small>
              </div>
            </div>
          </div>
        `;
        coursesContainer.innerHTML += courseCard;
      });

      // Add event listeners to the enroll buttons
      const enrollButtons = document.querySelectorAll('.enroll-btn');
      enrollButtons.forEach(button => {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          const courseId = this.getAttribute('data-course-id');
          enrollInCourse(courseId);
        });
      });
    })
    .catch(error => {
      console.error('Error fetching courses:', error);
    });

  // Function to enroll in a course
  function enrollInCourse(courseId) {
    fetch(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          alert(data.message);
        } else if (data.error) {
          alert('Error: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error enrolling in course:', error);
        alert('An error occurred while enrolling.');
      });
  }
});
