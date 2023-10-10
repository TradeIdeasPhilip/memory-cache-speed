Status:  Runnable, more work is in progress.

* On video
  * [Newer](https://youtube.com/shorts/VJVuV1MNjCo)
  * [Older](https://youtube.com/shorts/AqQ5JL59nLo?feature=share)

I know how to make memory fast in C++.
I’m wondering if some of the same tricks apply in JavaScript.

I just finished creating this web page so I could run some tests.
I will have some results to share soon.

If I access memory sequentially rather than randomly, will it make a measurable difference?

My laptop has 3 levels of RAM cache.
I wonder if I can find all 3 of them with my program.

# How To Run It

## Start Here

https://tradeideasphilip.github.io/memory-cache-speed/

## Create

Create a block of memory.
The new memory will appear in the list, below.
Use that list to select which memory to use in each test.

### Item Count

Each item is a 32 bit (4 byte) integer.
Select the number of items to use in each new block of memory.

### Random Data

Create a block of data which will be read in a random order.
Each request will give a slightly different result.

Note that all of the work of randomizing the order is done up front, when you hit this button.
The test button will not call Math.random().
The test is basically calling `index = array[index]` in a loop. 

### In Order

Create a new block of data.

With the default partition count of 1, the test will access this memory completely sequentially.

### Partition Count

This applies to memory created with the in order button.

1 means to examine each location in order in a single pass through the array.
2 means to examine every other location in order, then make a second pass to examine the remaining locations, in order.
n means to make n passes and each pass examine every nth item.

Lower numbers should lead to better cache performance.

## Running Tests

Select one or more blocks of memory then hit test.
This will send the request off to a thread.
This memory will be shared, not copied, between threads.
Multiple tests can run at the same time.

If you select more than one block of memory, the software will completely examine each block of memory once, before examining the first block a second time. 

A larger repetition count will lead to a more reliable measurement.
Do not use 666.

# Fast Memory Lookups

Here's one of the things that I want to test.
I want to data structure that is optimized for modern cached memory.

## Existing Option #1

Traditionally you would use an ordered list to store data when it's all in memory and you mostly do lookups.
Think of a phone book.
It's simple and effective.

## Existing Option #2

When you're dealing with data that will change a lot, you typically use tree structure.
And if that data is stored on disk, you will typically use a B+ tree, as that data structure is optimized for use with a disk cache.

## New Idea

Here's my question.
What would happen if I used a B+ tree for data that's all in memory and my only concern was read performance?
So take the requirements from option #1 and the implementation from option #2.
The algorithm would be more complicated than in option #1.
But memory is also slow and also managed by a cache.
So I would expect this same trick to make things fast when I'm storing all the data in memory.

I haven't seen this before.
A lot of these algorithms were written before memory caching was such a big deal.

My thought is to store the tree as a single array, like a heap data structure.
That way I don't need pointers and I save a lot of memory.
A heap is a special case of a binary tree.
I can do the same with an n-way tree, where n is selected to maximize effects of the cache and is an input to the algorithm.
Like a heap, this data structure will always be full, i.e. no empty spaces.

I'm actually picturing this in two contexts.
In one case I have one very large array, perhaps the main index into all my data.
Each key represents one _record_ stored somewhere else.
But a lot of my individual _records_ are smaller key/value stores.
A typical record might have 300 possible fields, each indexed by a number.
And that record often has around 100 - 200 fields actually filled in.
It's the exact same problem, just a question of scale.