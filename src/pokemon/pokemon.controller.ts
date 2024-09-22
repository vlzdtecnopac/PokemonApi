import { Controller, Get, Param, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('pokemon')
@Controller('pokemon')
@ApiResponse({ status: 200, description: 'Successfully retrieved list of Pokemons.' })
@ApiResponse({ status: 400, description: 'Invalid input.' })
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Number of items to return',
    example: '100',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: String,
    description: 'Offset for pagination',
    example: '1',
  })

  async findAll(
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '1',
  ) {
    const limitNumber = parseInt(limit, 100);
    const offsetNumber = parseInt(offset, 1);
    return await this.pokemonService.findAll(limitNumber, offsetNumber);
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return await this.pokemonService.findOne(name);
  }

  @Get('/pokemonAndTypes/:name')
  async pokemonAndType(@Param('name') name: string) {
    return await this.pokemonService.pokemonAndType(name);
  }
}
