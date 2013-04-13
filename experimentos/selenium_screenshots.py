# Para hacer los thumbnails de los mapitas

CROP_BOX = (24, 159, 24+401, 159+861)
THUMBNAIL_SIZE = (103, 103)

import selenium, time, string
from selenium import webdriver
from PIL import Image
browser = webdriver.Firefox()
browser.get('http://localhost:8000')

# selectar todos los links a los mapas
links = [l for l in browser.find_elements_by_css_selector('a[href^="#"]') if l.is_displayed()]
for l in links:
  l.click()
  time.sleep(0.25) # por si acaso

  basename = string.split(l.get_attribute('href'), '#')[1] + '.png'
  sc = '/tmp/mapas/' + basename
  browser.save_screenshot(sc)

  img = Image.open(sc)
  area = img.crop(CROP_BOX)
  area.thumbnail(THUMBNAIL_SIZE, Image.ANTIALIAS)
  area.save('/tmp/mapas/thumb_' + basename)

browser.quit()
