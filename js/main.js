$(function() {

	var countdownInterval = null;
	var startCountdown = function() {
		var countdown = document.getElementById("exam-countdown");
		if (!countdown) return;

		var parts = {
			days: countdown.querySelector('[data-countdown-part="days"]'),
			hours: countdown.querySelector('[data-countdown-part="hours"]'),
			minutes: countdown.querySelector('[data-countdown-part="minutes"]'),
			seconds: countdown.querySelector('[data-countdown-part="seconds"]')
		};

		var target = new Date("2026-05-04T09:00:00+02:00").getTime();

		function pad(value) {
			return String(value).padStart(2, "0");
		}

		function updateCountdown() {
			var remaining = Math.max(0, target - Date.now());
			var totalSeconds = Math.floor(remaining / 1000);
			var days = Math.floor(totalSeconds / 86400);
			var hours = Math.floor((totalSeconds % 86400) / 3600);
			var minutes = Math.floor((totalSeconds % 3600) / 60);
			var seconds = totalSeconds % 60;

			if (countdown) {
				countdown.classList.toggle("countdown-urgent", remaining <= 86400000);
				if (parts.days) parts.days.textContent = pad(days);
				if (parts.hours) parts.hours.textContent = pad(hours);
				if (parts.minutes) parts.minutes.textContent = pad(minutes);
				if (parts.seconds) parts.seconds.textContent = pad(seconds);
			}
		}

		if (parts.days && parts.hours && parts.minutes && parts.seconds) {
			if (countdownInterval) clearInterval(countdownInterval);
			updateCountdown();
			countdownInterval = setInterval(updateCountdown, 1000);
		}
	};

  // Inject floating menu toggle
  var floatingToggleHtml = '<div class="floating-menu-toggle js-menu-toggle"><span class="icon-menu h3 text-white"></span></div>';
  $('body').append(floatingToggleHtml);

  var siteSticky = function() {
		$(".js-sticky-header").sticky({topSpacing:0});
	};
	siteSticky();

	var updateTheme = function(path) {
		$('body').removeClass('theme-nyelvtan theme-irodalom');
		var logoText = 'TÖRTÉNELEM TÉTELEK';
		
		if (path.indexOf('/nyelvtan/') !== -1 || path.indexOf('nyelvtan/') === 0) {
			$('body').addClass('theme-nyelvtan');
			logoText = 'NYELVTAN TÉTELEK';
		} else if (path.indexOf('/irodalom/') !== -1 || path.indexOf('irodalom/') === 0) {
			$('body').addClass('theme-irodalom');
			logoText = 'IRODALOM TÉTELEK';
		}
		$('.site-logo-text, .site-logo a').text(logoText);
	};

	var getCategoryFromPath = function(path) {
		if (!path) {
			return 'tortenelem';
		}

		if (path.indexOf('/nyelvtan/') !== -1 || path.indexOf('nyelvtan/') === 0) {
			return 'nyelvtan';
		}

		if (path.indexOf('/irodalom/') !== -1 || path.indexOf('irodalom/') === 0) {
			return 'irodalom';
		}

		return 'tortenelem';
	};

	var setActiveCategoryTab = function(path) {
		var target = getCategoryFromPath(path);
		var $tab = $('.category-tab[data-target="' + target + '"]');

		if (!$tab.length) {
			return;
		}

		$('.category-tab').removeClass('active');
		$tab.addClass('active');
		$('.site-nav-wrap .category-item').addClass('d-none');
		$('.site-nav-wrap .category-item[data-category="' + target + '"]').removeClass('d-none');
	};

	var normalizeNavHref = function(href) {
		if (!href) {
			return '';
		}

		return href
			.replace(/^\.\.\//, '')
			.replace(/^\.?\//, '')
			.replace(/^\//, '')
			.replace(/\\/g, '/');
	};

	var setActiveNavLink = function(path) {
		var normalizedPath = normalizeNavHref(path).replace(/\.html(?:\?.*)?$/, '').replace(/#.*$/, '');
		var normalizedFileName = normalizedPath.split('/').pop();

		$('.site-menu.main-menu li, .site-nav-wrap li').removeClass('active');

		$('.site-menu.main-menu a, .site-nav-wrap a').each(function() {
			var href = normalizeNavHref($(this).attr('href')).replace(/\.html(?:\?.*)?$/, '').replace(/#.*$/, '');

			if (!href) {
				return;
			}

			if (href === normalizedPath || href.split('/').pop() === normalizedFileName) {
				$(this).closest('li').addClass('active');
			}
		});
	};

	var siteMenuClone = function() {

		$('.js-clone-nav').each(function() {
			var $this = $(this);
			$this.clone().attr('class', 'site-nav-wrap').appendTo('.site-mobile-menu-body');
		});

		// Add Category Tabs
		var tabsHtml = `
			<div class="category-tabs d-flex px-3 pb-2 border-bottom border-secondary">
				<div class="category-tab active flex-fill text-center py-2" data-target="tortenelem" style="cursor:pointer; font-size: 0.8rem; font-weight: 700;">TÖRTÉNELEM</div>
				<div class="category-tab flex-fill text-center py-2" data-target="nyelvtan" style="cursor:pointer; font-size: 0.8rem; font-weight: 700;">NYELVTAN</div>
				<div class="category-tab flex-fill text-center py-2" data-target="irodalom" style="cursor:pointer; font-size: 0.8rem; font-weight: 700;">IRODALOM</div>
			</div>
		`;
		$('.site-mobile-menu-header').after(tabsHtml);

		// Category Switch Logic
		$('body').on('click', '.category-tab', function() {
			var target = $(this).data('target');
			
			// Update Tabs UI
			$('.category-tab').removeClass('active');
			$(this).addClass('active');

			// Filter Menu Items
			$('.site-nav-wrap .category-item').addClass('d-none');
			$('.site-nav-wrap .category-item[data-category="' + target + '"]').removeClass('d-none');
		});

		// Set initial active state based on URL
		var currentPath = window.location.pathname;
		var fileName = currentPath.split('/').pop() || 'index.html';
		
		updateTheme(currentPath);

		setActiveCategoryTab(currentPath);

		setActiveNavLink(fileName);


		setTimeout(function() {
			
			var counter = 0;
      $('.site-mobile-menu .has-children').each(function(){
        var $this = $(this);
        
        $this.prepend('<span class="arrow-collapse collapsed">');

        $this.find('.arrow-collapse').attr({
          'data-toggle' : 'collapse',
          'data-target' : '#collapseItem' + counter,
        });

        $this.find('> ul').attr({
          'class' : 'collapse',
          'id' : 'collapseItem' + counter,
        });

        counter++;

      });

    }, 1000);

		$('body').on('click', '.arrow-collapse', function(e) {
      var $this = $(this);
      if ( $this.closest('li').find('.collapse').hasClass('show') ) {
        $this.removeClass('active');
      } else {
        $this.addClass('active');
      }
      e.preventDefault();  
      
    });

		$(window).resize(function() {
			var $this = $(this),
				w = $this.width();

			if ( w > 768 ) {
				if ( $('body').hasClass('offcanvas-menu') ) {
					$('body').removeClass('offcanvas-menu');
				}
			}
		})

		$('body').on('click', '.js-menu-toggle', function(e) {
			var $this = $(this);
			e.preventDefault();

			if ( $('body').hasClass('offcanvas-menu') ) {
				$('body').removeClass('offcanvas-menu');
				$this.removeClass('active');
			} else {
				var currentHash = window.location.hash ? window.location.hash.substring(1) : '';
				setActiveCategoryTab(currentHash || window.location.pathname);
				$('body').addClass('offcanvas-menu');
				$this.addClass('active');
			}
		}) 

		// click outisde offcanvas
		$(document).mouseup(function(e) {
	    var container = $(".site-mobile-menu");
	    if (!container.is(e.target) && container.has(e.target).length === 0) {
	      if ( $('body').hasClass('offcanvas-menu') ) {
					$('body').removeClass('offcanvas-menu');
				}
	    }
		});
	}; 
	siteMenuClone();
	startCountdown();

	var getRootPath = function() {
		var path = window.location.pathname;
		if (path.indexOf('/tortenelem/') !== -1 || path.indexOf('/nyelvtan/') !== -1 || path.indexOf('/irodalom/') !== -1) {
			return '../';
		}
		return '';
	};

	var loadPageHero = function(url, addToHistory) {
		$.get(url, function(response) {
			var temp = document.createElement('div');
			temp.innerHTML = response;

			var newWidget = temp.querySelector('.widget-bar');
			var newTitle = temp.querySelector('.page-title');

			if (!newWidget && !newTitle) {
				// Fallback: hard navigate if fragment missing
				window.location.href = url;
				return;
			}

			if (newWidget) {
				$('.widget-bar').replaceWith($(newWidget));
				// Restart countdown if we navigated back to a page with a countdown
				startCountdown();
			}

			if (newTitle) {
				$('.page-title').text(newTitle.textContent);
			}

			if (addToHistory) {
				// Normalize URL for hash: remove ../ and .html
				var slug = url.replace(/^\.\.\//, '').replace(/\.html(?:\?.*)?$/, '');
				if (window.location.hash !== '#' + slug) {
					window.location.hash = slug;
				}
				updateTheme(url);
				setActiveCategoryTab(url);
			}
		}).fail(function() {
			window.location.href = url;
		});
	};

	$('body').on('click', 'nav.site-navigation a, .site-nav-wrap a, .site-logo a', function(e) {
		var $link = $(this);
		var href = $link.attr('href');

		if (!href || $link.attr('target') === '_blank' || /\.pdf(?:\?.*)?$/i.test(href) || href.indexOf('#') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
			return;
		}

		e.preventDefault();

		$('body').removeClass('offcanvas-menu');
		$('.js-menu-toggle').removeClass('active');

		var root = getRootPath();
		// If the link already has ../ and we are in root, remove it
		// If the link doesn't have ../ and we are in subfolder, add it
		var targetUrl = href;
		if (root === '../' && href.indexOf('../') === -1) {
			targetUrl = '../' + href;
		} else if (root === '' && href.indexOf('../') === 0) {
			targetUrl = href.substring(3);
		}

		setActiveNavLink(targetUrl);
		loadPageHero(targetUrl, true);
	});

	// Initial load from hash (deep link support on refresh/bookmark)
	var loadFromHash = function() {
		var hash = window.location.hash;
		if (hash && hash.length > 1) {
			var slug = hash.substring(1);
			var root = getRootPath();
			var href = slug + '.html';
			
			var targetUrl = root + href;
			loadPageHero(targetUrl, false);
			updateTheme(targetUrl);
			setActiveCategoryTab(targetUrl);
			
			setActiveNavLink(targetUrl);
		}
	};
	loadFromHash();
	window.addEventListener('hashchange', loadFromHash);

	// Floating menu visibility on scroll
	var floatingToggleScroll = function() {
		var $floatingToggle = $('.floating-menu-toggle');
		var $navbar = $('.site-navbar');
		
		if ($navbar.length === 0) return;

		$(window).on('scroll', function() {
			var scrollTop = $(this).scrollTop();
			var navbarBottom = $navbar.offset().top + $navbar.outerHeight();
			
			// Show floating toggle if navbar is scrolled out of view
			if (scrollTop > navbarBottom) {
				$floatingToggle.addClass('visible');
			} else {
				$floatingToggle.removeClass('visible');
			}
		});
	};
	floatingToggleScroll();

	var updateVersionStorageKey = 'site_etag:' + window.location.pathname;
	var updateBaselineReadyKey = 'site_etag_ready:' + window.location.pathname;

	var fetchCurrentVersionTag = function(options) {
		return fetch(window.location.href, $.extend({ method: 'HEAD', cache: 'no-cache' }, options || {}))
			.then(function(response) {
				return response.headers.get('etag') || response.headers.get('last-modified') || '';
			});
	};

	var initializeUpdateBaseline = function() {
		return fetchCurrentVersionTag({ cache: 'reload' })
			.then(function(versionTag) {
				if (versionTag) {
					localStorage.setItem(updateVersionStorageKey, versionTag);
				} else {
					localStorage.removeItem(updateVersionStorageKey);
				}

				sessionStorage.setItem(updateBaselineReadyKey, 'true');
			})
			.catch(function(err) {
				console.log('Update baseline init failed', err);
			});
	};

	// Check for site updates
	var checkUpdate = function() {
		var baselineReady = sessionStorage.getItem(updateBaselineReadyKey) === 'true';
		var currentEtag = localStorage.getItem(updateVersionStorageKey);

		if (!baselineReady || !currentEtag) {
			return initializeUpdateBaseline();
		}

		// Polling for update
		return fetchCurrentVersionTag()
			.then(function(newEtag) {
				if (!newEtag) {
					return;
				}

				if (newEtag !== currentEtag) {
					showUpdateNotification(newEtag);
				}
			})
			.catch(function(err) {
				console.log('Update check failed', err);
			});
	};

	var showUpdateNotification = function(newVersionTag) {
		if ($('.update-notification').length > 0 || sessionStorage.getItem('update_ignored') === 'true') return;

		if (newVersionTag) {
			sessionStorage.setItem('pending_site_etag', newVersionTag);
		}

		var notifHtml = `
			<div class="update-notification">
				<span class="notif-text">Az oldal frissült!</span>
				<div class="d-flex align-items-center gap-2">
					<button class="btn-update">FRISSÍTÉS</button>
					<span class="icon-close2 notif-close" title="Ignorálás"></span>
				</div>
			</div>
		`;
		
		$('body').append(notifHtml);
		
		setTimeout(function() {
			$('.update-notification').addClass('show');
		}, 100);

		$('body').on('click', '.btn-update', function() {
			var pendingVersionTag = sessionStorage.getItem('pending_site_etag');
			if (pendingVersionTag) {
				localStorage.setItem(updateVersionStorageKey, pendingVersionTag);
			} else {
				localStorage.removeItem(updateVersionStorageKey);
			}

			sessionStorage.removeItem('pending_site_etag');
			sessionStorage.removeItem('update_ignored');
			sessionStorage.removeItem(updateBaselineReadyKey);
			window.location.reload(true);
		});

		$('body').on('click', '.notif-close', function() {
			$('.update-notification').removeClass('show');
			sessionStorage.setItem('update_ignored', 'true');
			setTimeout(function() {
				$('.update-notification').remove();
			}, 500);
		});
	};

	// Start checking for updates after 30 seconds
	setTimeout(function() {
		checkUpdate();
		// Poll every 5 minutes
		setInterval(checkUpdate, 300000);
	}, 30000);

});
