var bookMap = new Vue({
  el: '#mount-target',
  data: function() {
    return {
      displayBooks: [],
      searchTerm: null,
    };
  },
  watch: { //check to see if search term has changed & update results
    'searchTerm': function (val, oldVal) {
      console.log('new: %s, old: %s', val, oldVal)
      this.searchBooks(this.searchTerm);
    }
  },
  methods: {

    //Take country name & use Open Library API to search for books
    // tagged w/ that place
    
    searchBooks: function(searchTerm) {
      const theVue = this; // change to arrow function?
      console.log(searchTerm);
      console.log(`searching for books about the country "${searchTerm}"`);
      const url = 'https://openlibrary.org/search.json?place=' + searchTerm + '&subject=fiction' + '&limit=1000'; //API has a limit of 1000 
      console.log(url)
      //function that takes the name of a country and returns an array of books from Open Library API
      fetch(url)
      .then(function(response) {
      return response.json();
        }).then(function(data) {
        console.log(data); 
        theVue.displayBooks = data.docs;
        
      });
    
    },

    // link to book page on Goodreads.com

      gotoGoodreads: function(book) {
        if (book.id_goodreads == undefined) {
          return '';
        }
        else {
          return "https://www.goodreads.com/book/show/" + book.id_goodreads[0];
        }
    },

    // Show the cover image for each book if available & check 
    // all possible sources before returning no image

      imageUrl: function(book) {
      if (book.cover_i == undefined) {
        if (book.cover_edition_key == undefined) {
          if (book.isbn == undefined) {
            if (book.id_goodreads == undefined) {
              if (book.id_librarything == undefined) {
                if (book.oclc == undefined) {
                  if (book.lccn == undefined) {
                    return ''
                    }
                  else { 
                    return 'https://covers.openlibrary.org/b/lccn/' + book.lccn[0] + '-M.jpg';
                  } 
                }
                else {
                  return 'https://covers.openlibrary.org/b/oclc/' + book.oclc[0] + '-M.jpg';
                }
              }
              else {
                return 'https://covers.openlibrary.org/b/librarything/' + book.id_librarything[0] + '-M.jpg';
              }
            }
            else {
              return 'https://covers.openlibrary.org/b/goodreads/' + book.id_goodreads[0] + '-M.jpg';
            }
          }
          else {
            return 'https://covers.openlibrary.org/b/ISBN/' + book.isbn[0] + '-M.jpg';
          }
        }
        else {
          return 'https://covers.openlibrary.org/b/olid/' + book.cover_edition_key + '-M.jpg'; 
        }
      }
      else {
        return 'https://covers.openlibrary.org/b/id/' + book.cover_i + '-M.jpg'; 
        }
    },

    //Include author name with results if available

      getAuthorName: function(book) {
        if (book.author_name == undefined) {
          return '';
        }
        else {
          authorName = book.author_name[0];
          return authorName;
        }
      }
    
  },
  
  mounted: function () {
    this.searchBooks();
    },
    
}); 

var width = window.innerWidth,
height = window.innerHeight,
sens = 0.5, //globe sensitivity
focused;

//Setting Globe Projection
var projection = d3.geoOrthographic()
.scale(150)
.rotate([0, 0])
.translate([width / 2, height / 2])
.clipAngle(90);

var path = d3.geoPath()
.projection(projection);

//Create the SVG Container
var svg = d3.select("#globe-container").append("svg")
.attr("width", width)
.attr("height", height);

//Filling in Water on Globe
svg.append("path")
.datum({type: "Sphere"})
.attr("class", "water")
.attr("d", path)
.call(d3.behavior.drag()
  .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
  
// Drag event (water): can rotate when dragging on both water and land
.on("drag", function() { 
  var rotate = projection.rotate();
  projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
  svg.selectAll("path.land").attr("d", path);
  svg.selectAll(".focused").classed("focused", focused = false);
}))

var countryTooltip = d3.select("body").append("div").attr("class", "countryTooltip"),
countryList = d3.select("head").append("select").attr("name", "countries");

queue()
.defer(d3.json, "data/world-110m.json")
.defer(d3.tsv, "data/world-country-names.tsv")
.await(ready);

function ready(error, world, countryData) {

  var countryById = {},
  countries = topojson.feature(world, world.objects.countries).features;

  //Adding Countries to List
  countryData.forEach(function(d) {
    countryById[d.id] = d.name;
    option = countryList.append("option");
    option.text(d.name);
    option.property("value", d.id);
  });

  //Countries
  var world = svg.selectAll("path.land")
  .data(countries)
  .enter().append("path")
  .attr("class", "land")
  .attr("d", path)

  //Drag Event (Land)
  .call(d3.behavior.drag()
    .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
    .on("drag", function() {
      var rotate = projection.rotate();
      projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
      svg.selectAll("path.land").attr("d", path);
      svg.selectAll(".focused").classed("focused", focused = false);
    }))

  //Hover & Click Events
  .on("mouseover", function(d) {
    countryTooltip.text(countryById[d.id])
    .style("left", (d3.event.pageX + 7) + "px")
    .style("top", (d3.event.pageY - 15) + "px")
    .style("display", "block")
    .style("opacity", 1);
  })
  .on("mouseout", function(d) {
    countryTooltip.style("opacity", 0)
    .style("display", "none");
  })
  .on("mousemove", function(d) {
    countryTooltip.style("left", (d3.event.pageX + 7) + "px")
    .style("top", (d3.event.pageY - 15) + "px");
  })
  .on("click", function(d) {
    let countryName = countryById[d.id];
    //console.log(countryName);
    bookMap.searchTerm = countryName;
    //console.log(bookMap.searchTerm)
    });
};

  //Rotate Globe
  (function transition() {
    d3.transition()
    .duration(2500)
    .tween("rotate", function() {
      var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
      return function(t) {
        projection.rotate(r(t));
        svg.selectAll("path").attr("d", path)
        .classed("focused", function(d, i) { return d.id == focusedCountry.id ? focused = d : false; });
      };
    })
    });


  function country(cnt, sel) { 
    for(var i = 0, l = cnt.length; i < l; i++) {
      if(cnt[i].id == sel.value) {return cnt[i];}
    };
};
